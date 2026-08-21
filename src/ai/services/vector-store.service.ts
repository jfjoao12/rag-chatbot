import { createVectorRepository } from "../repositories/vector.repository";
import { embeddings } from "./embedding.service";

export const vectorRepository = createVectorRepository(embeddings);
