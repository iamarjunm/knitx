import { defineLive } from "next-sanity";
import { client } from "./client";

const readToken =
  process.env.SANITY_API_READ_TOKEN && process.env.SANITY_API_READ_TOKEN.trim().length > 0
    ? process.env.SANITY_API_READ_TOKEN
    : false;

export const { sanityFetch, SanityLive } = defineLive({
  client,
  serverToken: readToken,
  browserToken: false,
});
