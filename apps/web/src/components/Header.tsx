import Link from "next/link";
import { ShoppingCart, Search, Key } from "lucide-react";
import Image from "next/image";

export default function Header() {
  const categories = [
    "Rice & Flour",
    "Fruits & Vegetables",
    "Instan Food",
    "Beverages",
    "Snacks & Biscuits",
    "Frozen",
  ];
  return (
    <header className="items-center justify-center hidden lg:flex p-4 flex-col">
      <nav className="navbar max-w-[85%]">
        <div className="navbar-start gap-3">
          <a href="/" className="btn btn-ghost text-xl">
            <Image
              alt="hemart"
              src="/logo-revisi.png"
              width={100}
              height={50}
            />
          </a>
          <label className="input input-bordered flex items-center gap-2">
            <input
              type="text"
              className="w-[50vh] bg-base-200"
              placeholder="Find a product..."
            />
          </label>
          <button className="btn btn-ghost">
            <ShoppingCart />
          </button>
        </div>
        <div className="navbar-end gap-2">
          <Link className="btn btn-ghost" href="/login">
            Log in
          </Link>
          <Link className="btn btn-outline btn-success" href="/register">
            Sign in
          </Link>
        </div>
      </nav>
      <div>
        <div className="flex justify-between items-center gap-5 pt-2">
          {categories.map((category, index) => {
            return (
              <Link
                className="btn btn-ghost hover:btn-link"
                href={`/category/${category}`}
                key={index}
              >
                {category}
              </Link>
            );
          })}
        </div>
      </div>
      <div className="divider"></div>
    </header>
  );
}

