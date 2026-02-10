const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const defaultSkills = [
  // Languages
  { label: "TypeScript", icon: "/icons/typescript.png", category: "Languages", order: 0 },
  { label: "JavaScript", icon: "/icons/javascript.png", category: "Languages", order: 1 },
  { label: "Go", icon: "/icons/go.png", category: "Languages", order: 2 },
  { label: "Python", icon: "/icons/python.png", category: "Languages", order: 3 },
  { label: "C++", icon: "/icons/cplusplus.png", category: "Languages", order: 4 },
  { label: "Java", icon: "/icons/java.png", category: "Languages", order: 5 },
  { label: "Lua", icon: "/icons/lua.png", category: "Languages", order: 6 },

  // Frontend
  { label: "React", icon: "/icons/react.png", category: "Frontend", order: 0 },
  { label: "Next.js", icon: "/icons/nextdotjs.png", category: "Frontend", order: 1 },
  { label: "Angular", icon: "/icons/angular.png", category: "Frontend", order: 2 },
  { label: "Vite", icon: "/icons/vite.png", category: "Frontend", order: 3 },
  { label: "Tailwind CSS", icon: "/icons/tailwindcss.png", category: "Frontend", order: 4 },

  // Backend
  { label: "Node.js", icon: "/icons/nodedotjs.png", category: "Backend", order: 0 },
  { label: "Express", icon: "/icons/express.png", category: "Backend", order: 1 },
  { label: "Spring Boot", icon: "/icons/spring.png", category: "Backend", order: 2 },
  { label: "Prisma", icon: "/icons/prisma.png", category: "Backend", order: 3 },
  { label: "GraphQL", icon: "/icons/graphql.png", category: "Backend", order: 4 },

  // Databases
  { label: "PostgreSQL", icon: "/icons/postgresql.png", category: "Databases", order: 0 },
  { label: "MongoDB", icon: "/icons/mongodb.png", category: "Databases", order: 1 },
  { label: "Redis", icon: "/icons/redis.png", category: "Databases", order: 2 },
  { label: "MariaDB", icon: "/icons/mariadb.png", category: "Databases", order: 3 },

  // DevOps & Infra
  { label: "Docker", icon: "/icons/docker.png", category: "DevOps & Infra", order: 0 },
  { label: "Kubernetes", icon: "/icons/kubernetes.png", category: "DevOps & Infra", order: 1 },
  { label: "Terraform", icon: "/icons/terraform.png", category: "DevOps & Infra", order: 2 },
  { label: "Helm", icon: "/icons/helm.png", category: "DevOps & Infra", order: 3 },
  { label: "CI/CD", icon: "/icons/githubactions.png", category: "DevOps & Infra", order: 4 },
  { label: "NGINX", icon: "/icons/nginx.png", category: "DevOps & Infra", order: 5 },
  { label: "Traefik", icon: "/icons/traefikproxy.png", category: "DevOps & Infra", order: 6 },

  // Observability
  { label: "Prometheus", icon: "/icons/prometheus.png", category: "Observability", order: 0 },
  { label: "Grafana", icon: "/icons/grafana.png", category: "Observability", order: 1 },

  // Cloud & OS
  { label: "Azure", icon: "/icons/microsoftazure.png", category: "Cloud & OS", order: 0 },
  { label: "Linux", icon: "/icons/linux.png", category: "Cloud & OS", order: 1 },
  { label: "Ubuntu", icon: "/icons/ubuntu.png", category: "Cloud & OS", order: 2 },
  { label: "Debian", icon: "/icons/debian.png", category: "Cloud & OS", order: 3 },
  { label: "Arch", icon: "/icons/arch.png", category: "Cloud & OS", order: 4 },
  { label: "Manjaro", icon: "/icons/manjaro.png", category: "Cloud & OS", order: 5 },
  { label: "Proxmox", icon: "/icons/proxmox.png", category: "Cloud & OS", order: 6 },
  { label: "Unraid", icon: "/icons/unraid.png", category: "Cloud & OS", order: 7 },

  // Tools & Other
  { label: "Git", icon: "/icons/git.png", category: "Tools & Other", order: 0 },
  { label: "GitHub", icon: "/icons/github.png", category: "Tools & Other", order: 1 },
  { label: "Jest", icon: "/icons/jest.png", category: "Tools & Other", order: 2 },
  { label: "Unity", icon: "/icons/unity.png", category: "Tools & Other", order: 3 },
  { label: "Blender", icon: "/icons/blender.png", category: "Tools & Other", order: 4 },
  { label: "Roblox", icon: "/icons/roblox.png", category: "Tools & Other", order: 5 },
];

async function seedSkills() {
  try {
    const count = await prisma.skill.count();
    if (count > 0) {
      console.log(`✅ Skills already seeded (${count} found)`);
      return;
    }

    await prisma.skill.createMany({ data: defaultSkills });
    console.log(`✅ Seeded ${defaultSkills.length} default skills`);
  } catch (error) {
    console.error("❌ Failed to seed skills:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

seedSkills();
