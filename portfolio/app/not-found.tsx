import Link from "next/link";
import Topbar from "@/components/Topbar";

export default function NotFound() {
  return (
    <>
      <Topbar />
      <div className="landing-layout">
        <div className="landing-hero">
          <div className="eyebrow">404</div>
          <h1>Problem not found.</h1>
          <p>
            The system design page you&apos;re looking for doesn&apos;t exist
            (yet). <Link href="/">Head back to the index</Link> to browse all problems.
          </p>
        </div>
      </div>
    </>
  );
}
