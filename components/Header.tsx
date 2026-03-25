import Link from "next/link";
import { UserMenu } from "./UserMenu";

export function Header() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <h1 className="site-title">
          <Link href="/">Blog</Link>
        </h1>
        <nav className="nav-links" aria-label="Main">
          <Link href="/">Posts</Link>
          <Link href="/admin/new">New post</Link>
          <UserMenu />
        </nav>
      </div>
    </header>
  );
}
