import projectData from "./projects.json";

const projectImages = import.meta.glob<{ default: ImageMetadata }>(
  "../assets/projects/*",
  { eager: true },
);

export const projects = projectData.map((project) => {
  const image = projectImages[`../assets/projects/${project.image}`];
  if (!image) throw new Error(`Project image not found: ${project.image}`);
  return { ...project, image: image.default };
});
