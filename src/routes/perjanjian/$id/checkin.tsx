import { createFileRoute } from "@tanstack/react-router";
import { KondisiPage } from "@/components/kosproof/KondisiPage";

const T = "Check-in Kamar — KosProof";
const D = "Foto kondisi awal kamar per area dan tanda tangani bukti bersama pemilik kos.";

export const Route = createFileRoute("/perjanjian/$id/checkin")({
  head: () => ({
    meta: [
      { title: T },
      { name: "description", content: D },
      { property: "og:title", content: T },
      { property: "og:description", content: D },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <KondisiPage id={Route.useParams().id} fase="checkin" />,
});
