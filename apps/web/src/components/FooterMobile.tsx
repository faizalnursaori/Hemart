import { Facebook, Github, Twitter } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function FooterMobile() {
  const categories = [
    {
      category: "Rice",
      path: "/Rice.jpg",
      slug:'beras'
    },
    {
      category: "Fruit & Vegetables",
      path: "/fruitsandvegetables.jpg",
      slug:'fruit'
    },
    {
      category: "Instan Foods",
      path: "/readytoeat.jpg",
      slug:'instant'
    },
    {
      category: "Beverages",
      path: "/Beverages.jpg",
      slug:'beverages'
    },
    {
      category: "Snacks & Biscuits",
      path: "/Snacksandsweets.jpg",
      slug:'snacks'
    },
    {
      category: "Frozen",
      path: "/Frozen.jpg",
      slug:'frozen'
    },
  ];
  return (
    <div className="flex md:hidden flex-col">
      <div className="divider"></div>
      <div className="collapse collapse-arrow">
        <input type="checkbox" name="my-accordion-2" />
        <div className="collapse-title font-medium">ABOUT US, HELP & POLICIES</div>
        <div className="collapse-content flex flex-col ml-2 gap-2">
          <Link className="hover:underline" href="/about">
            About Us
          </Link>
          <Link className="hover:underline" href="/profile">
            My Profile
          </Link>
          <Link className="hover:underline" href="/cart">
            Cart
          </Link>
          <Link className="hover:underline" href="/order/list">
            Orders
          </Link>
          <Link className="hover:underline" href="/policies">
            Privacy Policy
          </Link>
          <Link className="hover:underline" href=""></Link>
        </div>
      </div>
      <div className="collapse collapse-arrow ">
        <input type="checkbox" name="my-accordion-2" />
        <div className="collapse-title font-medium">TOP CATEGORIES</div>
        <div className="collapse-content flex flex-col ml-2 gap-2">
          {categories.map((category, index) => {
            return (
              <Link
                className="hover:underline"
                href={`/category/${category.slug}`}
                key={index}
              >
                {category.category}
              </Link>
            );
          })}
        </div>
      </div>
      <div className="collapse collapse-arrow">
        <input type="checkbox" name="my-accordion-2" />
        <div className="collapse-title font-medium">SUPPORT HOTLINE</div>
        <div className="collapse-content flex flex-col ml-2 gap-2">
          <div>
            <p className="font-bold text-sm">Hotline:</p>
            <p>Monday - Friday 9:00am - 5:00pm</p>
            <p>+62 123456789</p>
          </div>
          <div>
            <p className="text-sm">
              <span className="font-bold">Email: </span>info@hemart.com
            </p>
          </div>
          <div>
            <p className="text-sm">
              Our hotline number supports only Bahasa and English. For other
              language assistance, please send us an email.
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4 mt-2">
        <p className="font-medium ml-4">SHIPPING PARTNER</p>
        <div className="flex gap-3 items-center ml-4">
          <Image src="/ShippingLogo/JNE.png" alt="JNE" width={40} height={40} />
          <Image src="/ShippingLogo/POS.png" alt="POS" width={40} height={40} />
          <Image
            src="/ShippingLogo/TIKI.png"
            alt="TIKI"
            width={40}
            height={40}
          />
        </div>
      </div>
      <div>
        <p className="font-medium ml-4 mt-4">FOLLOW US ON SOCIAL MEDIA</p>
        <div className="flex gap-2 py-2 ml-4">
          <Link className="btn btn-ghost" href="https://www.facebook.com/profile.php?id=61566275623520">
            <Facebook />
          </Link>
          <Link className="btn btn-ghost" href="https://github.com/faizalnursaori/finpro_jcwdol014">
            <Github />
          </Link>
          <Link className="btn btn-ghost" href="https://x.com/Hemart1879150">
            <Twitter />
          </Link>
        </div>
      </div>
    </div>
  );
}
