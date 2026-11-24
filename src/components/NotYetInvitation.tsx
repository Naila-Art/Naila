import styles from "./invitation.module.css";
import type { Lang } from "@/lib/types";

/** Public link of an invitation that isn't paid yet. */
export default function NotYetInvitation({ lang }: { lang: Lang }) {
  const ar = lang === "ar";
  return (
    <main className={styles.closed} dir={ar ? "rtl" : "ltr"} lang={lang}>
      <div>
        <h1>{ar ? "الدعوة لسه مش متاحة" : "This invitation isn't available yet"}</h1>
        <p>{ar ? "اللينك ده هيشتغل قريب." : "Please check back soon."}</p>
      </div>
    </main>
  );
}
