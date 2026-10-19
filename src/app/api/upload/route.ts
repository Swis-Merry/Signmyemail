import { apiUser, unauthorized } from "@/lib/api";
import { handleUpload } from "@/lib/upload";

export async function POST(req: Request) {
  if (!(await apiUser())) return unauthorized();
  return handleUpload(req);
}
