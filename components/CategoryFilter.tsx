import Link from "next/link";

type Props = {
  categories: string[];
  active?: string;
};

export function CategoryFilter({ categories, active }: Props) {
  if (categories.length === 0) return null;

  return (
    <div className="category-filters">
      <Link href="/" className={`category-pill${!active ? " category-pill--active" : ""}`}>
        All
      </Link>
      {categories.map((c) => (
        <Link
          key={c}
          href={`/?category=${encodeURIComponent(c)}`}
          className={`category-pill${active === c ? " category-pill--active" : ""}`}
        >
          {c}
        </Link>
      ))}
    </div>
  );
}
