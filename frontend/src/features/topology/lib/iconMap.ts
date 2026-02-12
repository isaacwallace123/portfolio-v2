type IconRule = {
  pattern: RegExp;
  icon: string;
};

const IMAGE_RULES: IconRule[] = [
  { pattern: /postgres/i, icon: '/uploads/icons/postgresql.png' },
  { pattern: /redis/i, icon: '/uploads/icons/redis.png' },
  { pattern: /nginx/i, icon: '/uploads/icons/nginx.png' },
  { pattern: /prom\/prometheus|prometheus/i, icon: '/uploads/icons/prometheus.png' },
  { pattern: /grafana/i, icon: '/uploads/icons/grafana.png' },
  { pattern: /traefik/i, icon: '/uploads/icons/traefikproxy.png' },
  { pattern: /mongo/i, icon: '/uploads/icons/mongodb.png' },
  { pattern: /mariadb/i, icon: '/uploads/icons/mariadb.png' },
  { pattern: /\bnode:/i, icon: '/uploads/icons/nodedotjs.png' },
  { pattern: /nextjs|next\./i, icon: '/uploads/icons/nextdotjs.png' },
  { pattern: /python/i, icon: '/uploads/icons/python.png' },
  { pattern: /golang|\/go:/i, icon: '/uploads/icons/go.png' },
  { pattern: /ubuntu/i, icon: '/uploads/icons/ubuntu.png' },
  { pattern: /debian/i, icon: '/uploads/icons/debian.png' },
  { pattern: /alpine/i, icon: '/uploads/icons/linux.png' },
  { pattern: /java:/i, icon: '/uploads/icons/java.png' },
  { pattern: /spring/i, icon: '/uploads/icons/spring.png' },
  { pattern: /angular/i, icon: '/uploads/icons/angular.png' },
  { pattern: /vite/i, icon: '/uploads/icons/vite.png' },
  { pattern: /helm/i, icon: '/uploads/icons/helm.png' },
  { pattern: /kubernetes|k8s|k3s/i, icon: '/uploads/icons/kubernetes.png' },
  { pattern: /terraform/i, icon: '/uploads/icons/terraform.png' },
  { pattern: /azure/i, icon: '/uploads/icons/microsoftazure.png' },
  { pattern: /proxmox/i, icon: '/uploads/icons/proxmox.png' },
];

const NAME_RULES: IconRule[] = [
  { pattern: /postgres|_db$/i, icon: '/uploads/icons/postgresql.png' },
  { pattern: /redis/i, icon: '/uploads/icons/redis.png' },
  { pattern: /frontend|next/i, icon: '/uploads/icons/nextdotjs.png' },
  { pattern: /infra|agent/i, icon: '/uploads/icons/go.png' },
  { pattern: /nginx/i, icon: '/uploads/icons/nginx.png' },
  { pattern: /grafana/i, icon: '/uploads/icons/grafana.png' },
  { pattern: /prometheus/i, icon: '/uploads/icons/prometheus.png' },
  { pattern: /traefik/i, icon: '/uploads/icons/traefikproxy.png' },
  { pattern: /tunnel|cloudflare/i, icon: '/uploads/icons/docker.png' },
  { pattern: /plex/i, icon: '/uploads/icons/docker.png' },
  { pattern: /sonarr|radarr|prowlarr|bazarr|lidarr/i, icon: '/uploads/icons/docker.png' },
  { pattern: /mongo/i, icon: '/uploads/icons/mongodb.png' },
  { pattern: /mariadb/i, icon: '/uploads/icons/mariadb.png' },
];

const FALLBACK_ICON = '/uploads/icons/docker.png';

export function detectIconFromImage(imageName: string): string {
  for (const rule of IMAGE_RULES) {
    if (rule.pattern.test(imageName)) {
      return rule.icon;
    }
  }
  return FALLBACK_ICON;
}

export function detectIconFromContainer(imageName: string, containerName: string): string {
  const fromImage = detectIconFromImage(imageName);
  if (fromImage !== FALLBACK_ICON) return fromImage;

  for (const rule of NAME_RULES) {
    if (rule.pattern.test(containerName)) {
      return rule.icon;
    }
  }

  return FALLBACK_ICON;
}
