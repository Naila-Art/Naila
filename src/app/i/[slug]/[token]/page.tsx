import InvitationPage, { invitationMetadata } from "@/components/InvitationPage";

type Props = { params: Promise<{ slug: string; token: string }> };

/** Named invitation: one link per guest, greeting includes their title and name. */
export async function generateMetadata({ params }: Props) {
  const { slug, token } = await params;
  return invitationMetadata(slug, token);
}

export default async function Page({ params }: Props) {
  const { slug, token } = await params;
  return <InvitationPage slug={slug} token={token} />;
}
