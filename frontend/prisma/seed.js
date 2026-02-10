const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const defaultCategories = [
  { name: "Languages", order: 0 },
  { name: "Frontend", order: 1 },
  { name: "Backend", order: 2 },
  { name: "Databases", order: 3 },
  { name: "DevOps & Infra", order: 4 },
  { name: "Observability", order: 5 },
  { name: "Cloud & OS", order: 6 },
  { name: "Tools & Other", order: 7 },
];

const defaultSkills = [
  // Languages
  { label: "TypeScript", icon: "/icons/typescript.png", categoryName: "Languages", order: 0 },
  { label: "JavaScript", icon: "/icons/javascript.png", categoryName: "Languages", order: 1 },
  { label: "Go", icon: "/icons/go.png", categoryName: "Languages", order: 2 },
  { label: "Python", icon: "/icons/python.png", categoryName: "Languages", order: 3 },
  { label: "C++", icon: "/icons/cplusplus.png", categoryName: "Languages", order: 4 },
  { label: "Java", icon: "/icons/java.png", categoryName: "Languages", order: 5 },
  { label: "Lua", icon: "/icons/lua.png", categoryName: "Languages", order: 6 },

  // Frontend
  { label: "React", icon: "/icons/react.png", categoryName: "Frontend", order: 0 },
  { label: "Next.js", icon: "/icons/nextdotjs.png", categoryName: "Frontend", order: 1 },
  { label: "Angular", icon: "/icons/angular.png", categoryName: "Frontend", order: 2 },
  { label: "Vite", icon: "/icons/vite.png", categoryName: "Frontend", order: 3 },
  { label: "Tailwind CSS", icon: "/icons/tailwindcss.png", categoryName: "Frontend", order: 4 },

  // Backend
  { label: "Node.js", icon: "/icons/nodedotjs.png", categoryName: "Backend", order: 0 },
  { label: "Express", icon: "/icons/express.png", categoryName: "Backend", order: 1 },
  { label: "Spring Boot", icon: "/icons/spring.png", categoryName: "Backend", order: 2 },
  { label: "Prisma", icon: "/icons/prisma.png", categoryName: "Backend", order: 3 },
  { label: "GraphQL", icon: "/icons/graphql.png", categoryName: "Backend", order: 4 },

  // Databases
  { label: "PostgreSQL", icon: "/icons/postgresql.png", categoryName: "Databases", order: 0 },
  { label: "MongoDB", icon: "/icons/mongodb.png", categoryName: "Databases", order: 1 },
  { label: "Redis", icon: "/icons/redis.png", categoryName: "Databases", order: 2 },
  { label: "MariaDB", icon: "/icons/mariadb.png", categoryName: "Databases", order: 3 },

  // DevOps & Infra
  { label: "Docker", icon: "/icons/docker.png", categoryName: "DevOps & Infra", order: 0 },
  { label: "Kubernetes", icon: "/icons/kubernetes.png", categoryName: "DevOps & Infra", order: 1 },
  { label: "Terraform", icon: "/icons/terraform.png", categoryName: "DevOps & Infra", order: 2 },
  { label: "Helm", icon: "/icons/helm.png", categoryName: "DevOps & Infra", order: 3 },
  { label: "CI/CD", icon: "/icons/githubactions.png", categoryName: "DevOps & Infra", order: 4 },
  { label: "NGINX", icon: "/icons/nginx.png", categoryName: "DevOps & Infra", order: 5 },
  { label: "Traefik", icon: "/icons/traefikproxy.png", categoryName: "DevOps & Infra", order: 6 },

  // Observability
  { label: "Prometheus", icon: "/icons/prometheus.png", categoryName: "Observability", order: 0 },
  { label: "Grafana", icon: "/icons/grafana.png", categoryName: "Observability", order: 1 },

  // Cloud & OS
  { label: "Azure", icon: "/icons/microsoftazure.png", categoryName: "Cloud & OS", order: 0 },
  { label: "Linux", icon: "/icons/linux.png", categoryName: "Cloud & OS", order: 1 },
  { label: "Ubuntu", icon: "/icons/ubuntu.png", categoryName: "Cloud & OS", order: 2 },
  { label: "Debian", icon: "/icons/debian.png", categoryName: "Cloud & OS", order: 3 },
  { label: "Arch", icon: "/icons/arch.png", categoryName: "Cloud & OS", order: 4 },
  { label: "Manjaro", icon: "/icons/manjaro.png", categoryName: "Cloud & OS", order: 5 },
  { label: "Proxmox", icon: "/icons/proxmox.png", categoryName: "Cloud & OS", order: 6 },
  { label: "Unraid", icon: "/icons/unraid.png", categoryName: "Cloud & OS", order: 7 },

  // Tools & Other
  { label: "Git", icon: "/icons/git.png", categoryName: "Tools & Other", order: 0 },
  { label: "GitHub", icon: "/icons/github.png", categoryName: "Tools & Other", order: 1 },
  { label: "Jest", icon: "/icons/jest.png", categoryName: "Tools & Other", order: 2 },
  { label: "Unity", icon: "/icons/unity.png", categoryName: "Tools & Other", order: 3 },
  { label: "Blender", icon: "/icons/blender.png", categoryName: "Tools & Other", order: 4 },
  { label: "Roblox", icon: "/icons/roblox.png", categoryName: "Tools & Other", order: 5 },
];

async function seed() {
  try {
    const categoryCount = await prisma.category.count();
    if (categoryCount > 0) {
      console.log(`Categories already seeded (${categoryCount} found)`);
      return;
    }

    // Seed categories
    await prisma.category.createMany({ data: defaultCategories });
    console.log(`Seeded ${defaultCategories.length} categories`);

    // Build name -> id map
    const categories = await prisma.category.findMany();
    const categoryMap = new Map(categories.map((c) => [c.name, c.id]));

    // Seed skills with category IDs
    const skillsData = defaultSkills.map(({ categoryName, ...rest }) => ({
      ...rest,
      categoryId: categoryMap.get(categoryName),
    }));

    await prisma.skill.createMany({ data: skillsData });
    console.log(`Seeded ${skillsData.length} skills`);
  } catch (error) {
    console.error("Failed to seed:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
