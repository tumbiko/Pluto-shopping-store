export async function GET() {
  console.log("PROJECT_ID =>", process.env.PROJECT_ID);
  console.log("DATASET =>", process.env.DATASET);
  return Response.json({ ok: true });
}
