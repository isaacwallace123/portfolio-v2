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

const defaultExperiences = [
  // Work
  {
    id: "exp_work_kleff",
    type: "WORK",
    title: "Founder",
    titleFr: "Fondateur",
    organization: "Kleff",
    organizationFr: "Kleff",
    description: "Leading the vision, architecture, and development of Kleff, a developer-first cloud infrastructure platform. I design and build the core systems while guiding product direction, technical strategy, and business operations.",
    descriptionFr: "Diriger la vision, l'architecture et le développement de Kleff, une plateforme d'infrastructure cloud axée sur les développeurs. Je conçois et construis les systèmes principaux tout en guidant la direction du produit, la stratégie technique et les opérations commerciales.",
    location: "Montreal, Quebec, Canada \u00b7 Hybrid",
    locationFr: "Montréal, Québec, Canada \u00b7 Hybride",
    jobType: "Self-employed",
    jobTypeFr: "Travailleur autonome",
    startDate: new Date("2024-11-01T12:00:00Z"),
    endDate: null,
    skills: [],
    order: 0,
  },
  {
    id: "exp_work_cc",
    type: "WORK",
    title: "Sales Associate",
    titleFr: "Associé aux ventes",
    organization: "Canada Computers & Electronics",
    organizationFr: "Canada Computers & Electronics",
    description: "I communicated with clients to understand their needs and guide them towards a product that matched their requirements.",
    descriptionFr: "J'ai communiqué avec les clients pour comprendre leurs besoins et les guider vers un produit correspondant à leurs exigences.",
    location: "Brossard, Quebec, Canada \u00b7 On-site",
    locationFr: "Brossard, Québec, Canada \u00b7 Sur place",
    jobType: "Permanent Part-time",
    jobTypeFr: "Temps partiel permanent",
    startDate: new Date("2024-11-01T12:00:00Z"),
    endDate: null,
    skills: [],
    order: 1,
  },
  {
    id: "exp_work_costco",
    type: "WORK",
    title: "Stocker",
    titleFr: "Manutentionnaire",
    organization: "Costco Wholesale",
    organizationFr: "Costco Wholesale",
    description: "I was a merchandise placer responsible for placing stock and maintaining prices and quality in the freezer department.",
    descriptionFr: "J'étais responsable du placement des marchandises et du maintien des prix et de la qualité dans le département des surgelés.",
    location: "Candiac, Quebec, Canada \u00b7 On-site",
    locationFr: "Candiac, Québec, Canada \u00b7 Sur place",
    jobType: "Permanent Part-time",
    jobTypeFr: "Temps partiel permanent",
    startDate: new Date("2023-05-01T12:00:00Z"),
    endDate: new Date("2024-08-01T12:00:00Z"),
    skills: [],
    order: 2,
  },
  {
    id: "exp_work_mcdonalds",
    type: "WORK",
    title: "Team Leader",
    titleFr: "Chef d'équipe",
    organization: "McDonald's",
    organizationFr: "McDonald's",
    description: "I worked as the team leader for the McDonalds kitchen team to ensure quality control, fluid workflow, and proper customer satisfaction.",
    descriptionFr: "J'ai travaillé comme chef d'équipe de la cuisine McDonald's pour assurer le contrôle qualité, un flux de travail fluide et la satisfaction client.",
    location: "Laprairie, Quebec, Canada \u00b7 On-site",
    locationFr: "Laprairie, Québec, Canada \u00b7 Sur place",
    jobType: "Permanent Part-time",
    jobTypeFr: "Temps partiel permanent",
    startDate: new Date("2019-11-01T12:00:00Z"),
    endDate: new Date("2021-09-01T12:00:00Z"),
    skills: [],
    order: 3,
  },

  // Education
  {
    id: "exp_edu_champlain",
    type: "EDUCATION",
    title: "DEC in Computer Science",
    titleFr: "DEC en informatique",
    organization: "Champlain College",
    organizationFr: "Collège Champlain",
    description: "Focused on software development, algorithms, data structures, and system design.",
    descriptionFr: "Axé sur le développement logiciel, les algorithmes, les structures de données et la conception de systèmes.",
    location: "Saint-Lambert, Quebec",
    locationFr: "Saint-Lambert, Québec",
    startDate: new Date("2022-08-01T12:00:00Z"),
    endDate: null,
    skills: [],
    order: 0,
  },

  // Certification
  {
    id: "exp_cert_testout",
    type: "CERTIFICATION",
    title: "TestOut PC Pro Certification",
    titleFr: "Certification TestOut PC Pro",
    organization: "TestOut Corporation",
    organizationFr: "TestOut Corporation",
    startDate: new Date("2023-05-01T12:00:00Z"),
    credentialId: "6-1C6-V4QAX8",
    credentialUrl: "https://certification.testout.com/verifycert/6-1C6-V4QAX8",
    skills: ["Computer Hardware", "Technical Support"],
    order: 0,
  },

  // Volunteer
  {
    id: "exp_vol_videotron",
    type: "VOLUNTEER",
    title: "Fundraiser",
    titleFr: "Collecteur de fonds",
    organization: "Vidéotron",
    organizationFr: "Vidéotron",
    description: "Participated in a fundraising initiative for Enfants du Soleil with Vidéotron, working outdoors alongside other volunteers to collect donations in support of children's healthcare.",
    descriptionFr: "J'ai participé à une initiative de collecte de fonds pour Enfants du Soleil avec Vidéotron, travaillant en extérieur aux côtés d'autres bénévoles pour collecter des dons en soutien aux soins de santé des enfants.",
    cause: "Children",
    causeFr: "Enfants",
    startDate: new Date("2013-04-01T12:00:00Z"),
    endDate: new Date("2013-05-01T12:00:00Z"),
    skills: [],
    order: 0,
  },
];

async function seed() {
  try {
    // Seed categories & skills
    const categoryCount = await prisma.category.count();
    if (categoryCount > 0) {
      console.log(`Categories already seeded (${categoryCount} found)`);
    } else {
      await prisma.category.createMany({ data: defaultCategories });
      console.log(`Seeded ${defaultCategories.length} categories`);

      const categories = await prisma.category.findMany();
      const categoryMap = new Map(categories.map((c) => [c.name, c.id]));

      const skillsData = defaultSkills.map(({ categoryName, ...rest }) => ({
        ...rest,
        categoryId: categoryMap.get(categoryName),
      }));

      await prisma.skill.createMany({ data: skillsData });
      console.log(`Seeded ${skillsData.length} skills`);
    }

    // Seed experiences
    const experienceCount = await prisma.experience.count();
    if (experienceCount > 0) {
      console.log(`Experiences already seeded (${experienceCount} found)`);
    } else {
      for (const exp of defaultExperiences) {
        await prisma.experience.create({ data: exp });
      }
      console.log(`Seeded ${defaultExperiences.length} experiences`);
    }
  } catch (error) {
    console.error("Failed to seed:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
