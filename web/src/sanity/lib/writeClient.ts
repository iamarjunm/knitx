import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "../env";

const writeToken = process.env.SANITY_API_WRITE_TOKEN;

export const hasSanityWriteToken = Boolean(writeToken && writeToken.trim().length > 0);

export const writeClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: writeToken,
});
