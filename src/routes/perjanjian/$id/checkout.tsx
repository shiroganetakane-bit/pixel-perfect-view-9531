import { createFileRoute } from "@tanstack/react-router";
import { KondisiPage } from "@/components/kosproof/KondisiPage";

const T = "Check-out Kamar — KosProof";
const D = "Foto kondisi akhir kamar dan bandingkan berdampingan dengan foto saat check-in.";

export const Route = createFileRoute("/perjanjian/$id/checkout")({
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
  component: () => <KondisiPage id={Route.useParams().id} fase="checkout" />,
});
