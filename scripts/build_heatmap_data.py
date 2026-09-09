"""
Reduces the ValHeatMap example matches to just what the browser demo plots.

Run once, by hand — not part of `next build`:

    python scripts/build_heatmap_data.py <dir with example_*_game.json>

The raw Riot match files total about 3.7MB and are almost entirely damage,
economy and ability records the map never draws. This keeps the kill feed and
the roster, which is a fraction of the size.

Reads the same fields ValHeatMap's models.py does, so the demo plots exactly
what the Flask service would have.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

# Game path to display name, mirroring Constants.py.
MAPS = {
    "/Game/Maps/Ascent/Ascent": "Ascent",
    "/Game/Maps/Duality/Duality": "Bind",
    "/Game/Maps/Canyon/Canyon": "Fracture",
    "/Game/Maps/Triad/Triad": "Haven",
    "/Game/Maps/Port/Port": "Icebox",
    "/Game/Maps/Bonsai/Bonsai": "Split",
}


def player_id(record: dict) -> str | None:
    """
    Riot renamed the player identifier between API versions: newer matches use
    `puuid`, older ones `subject`. The example matches include both.
    """
    return record.get("puuid") or record.get("subject")


def round_time(kill: dict) -> int:
    """Round timestamp, under either the old or the new field name."""
    value = kill.get("timeSinceRoundStartMillis")
    return int(value if value is not None else kill.get("roundTime", 0))


def build(path: Path) -> dict | None:
    match = json.loads(path.read_text(encoding="utf-8"))
    map_id = match["matchInfo"]["mapId"]
    if map_id not in MAPS:
        print(f"  skipped {path.name}: unknown map {map_id}")
        return None

    # Short ids keep the payload small; puuids are 80+ characters each.
    players: dict[str, dict] = {}
    for index, player in enumerate(match["players"]):
        key = player_id(player)
        if key is None:
            print(f"  skipped {path.name}: player record has no id field")
            return None
        players[key] = {
            "id": index,
            "name": f"{player.get('gameName', 'Player')}#{player.get('tagLine', '')}".strip("#"),
            "team": player.get("teamId", "Unknown"),
            "agent": player.get("characterId", ""),
        }

    kills = []
    for round_result in match["roundResults"]:
        round_number = round_result["roundNum"]
        for stats in round_result["playerStats"]:
            for kill in stats["kills"]:
                killer = kill["killer"]
                victim = kill["victim"]
                if killer not in players or victim not in players:
                    continue

                # The kill record carries the victim's position directly, but the
                # killer's has to be looked up in the per-kill location snapshot.
                killer_location = next(
                    (
                        entry["location"]
                        for entry in kill.get("playerLocations", [])
                        if player_id(entry) == killer
                    ),
                    None,
                )
                if killer_location is None:
                    continue

                kills.append(
                    {
                        "round": round_number,
                        "t": round_time(kill),
                        "killer": players[killer]["id"],
                        "victim": players[victim]["id"],
                        "kx": killer_location["x"],
                        "ky": killer_location["y"],
                        "vx": kill["victimLocation"]["x"],
                        "vy": kill["victimLocation"]["y"],
                    }
                )

    return {
        "map": MAPS[map_id],
        "mapId": map_id,
        "rounds": len(match["roundResults"]),
        "players": [
            {"id": p["id"], "name": p["name"], "team": p["team"], "agent": p["agent"]}
            for p in sorted(players.values(), key=lambda p: p["id"])
        ],
        "kills": kills,
    }


def main() -> None:
    source = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
    out_dir = Path(__file__).resolve().parent.parent / "public/data/valheatmap"
    out_dir.mkdir(parents=True, exist_ok=True)

    index = []
    for path in sorted(source.glob("example_*_game.json")):
        data = build(path)
        if data is None:
            continue

        slug = data["map"].lower()
        target = out_dir / f"{slug}.json"
        target.write_text(json.dumps(data, separators=(",", ":")), encoding="utf-8")

        before = path.stat().st_size
        after = target.stat().st_size
        print(
            f"  {data['map']:<9} {len(data['kills']):>3} kills  "
            f"{before // 1024:>4}KB -> {after // 1024:>3}KB"
        )
        index.append(
            {
                "slug": slug,
                "map": data["map"],
                "rounds": data["rounds"],
                "kills": len(data["kills"]),
            }
        )

    if not index:
        raise SystemExit(f"No example_*_game.json found in {source}")

    (out_dir / "index.json").write_text(
        json.dumps(index, indent=2) + "\n", encoding="utf-8"
    )
    print(f"\nWrote {len(index)} matches to {out_dir}")


if __name__ == "__main__":
    main()
