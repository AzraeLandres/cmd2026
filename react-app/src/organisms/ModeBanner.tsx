import { useQuery } from "@apollo/client";
import { GET_MODE } from "@graphql/queries";

export default function ModeBanner() {
  const { data } = useQuery<{ mode: string }>(GET_MODE);

  if (data?.mode !== "demo") return null;

  return (
    <div
      className="bg-accent px-4 py-2 text-center text-xs font-semibold text-white"
      role="status"
      aria-live="polite"
    >
      Mode démo — données simulées (configurez une clé API pour le direct réel)
    </div>
  );
}
