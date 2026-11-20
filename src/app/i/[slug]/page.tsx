import InvitationPage, { invitationMetadata } from "@/components/InvitationPage";

type Props = { params: Promise<{ slug: string }> };

/** General invitation: one link for everyone, no guest name. */
export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return invitationMetadata(slug);
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  return <InvitationPage slug={slug} />;
}
