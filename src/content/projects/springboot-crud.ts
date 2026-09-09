import type { Project } from "@/lib/types";

export const springbootCrud: Project = {
  slug: "springboot-crud",
  title: "Student Management API",
  tagline: "A full-stack CRUD app, containerised for AWS.",
  year: "2022",
  tier: 3,
  featured: false,
  collection: "personal",
  tech: [
    { label: "Java", category: "language" },
    { label: "Spring Boot", category: "framework" },
    { label: "React", category: "framework" },
    { label: "AWS Elastic Beanstalk", category: "platform" },
  ],
  repoUrl: "https://github.com/roshanarunk/Springboot",
  summary:
    "A Spring Boot REST API with a React front end for managing student records, packaged with Docker Compose for deployment to Elastic Beanstalk.",
  longDescription: [
    "My introduction to a properly layered backend: controller, service and model separated, with a REST API the front end talks to over a thin client wrapper rather than scattering fetch calls through components.",
    "The React front end handles the full CRUD surface with a drawer-based form and notification handling. The deployment configuration is the part I learned most from — containerising both halves and configuring Elastic Beanstalk to run them was my first experience of the gap between code that works locally and code that is deployed.",
  ],
  highlights: [
    "Layered Spring Boot architecture with a clean controller and service split",
    "React front end talking to the API through a single client module",
    "Docker Compose packaging targeting AWS Elastic Beanstalk",
  ],
  disclosure:
    "The backend is not currently hosted, so there is no live demo — the code and deployment configuration tell the story.",
  demo: {
    kind: "writeup",
    title: "The API surface",
    excerpts: [
      {
        file: "student/StudentController.java",
        language: "java",
        code: `@RestController
@RequestMapping(path = "api/v1/students")
public class StudentController {
    private final StudentService studentService;

    @GetMapping
    public List<Student> getAllStudents() {
        return studentService.getAllStudents();
    }
}`,
        note: "The controller stays thin and delegates to the service layer, which is what makes the API testable.",
      },
    ],
    sourceUrl: "https://github.com/roshanarunk/Springboot",
  },
};
