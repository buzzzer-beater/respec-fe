export interface SidebarNavLink {
  href: string;
  label: string;
}

export interface SidebarProject {
  name: string;
  /** 이름 아래 작은 글씨. 없으면 비웁니다. */
  plan?: string;
  imageUrl?: string;
}
