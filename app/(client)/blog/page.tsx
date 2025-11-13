import Container from "@/components/Container";
import { urlFor } from "@/sanity/lib/image";
import { getAllBlogs } from "@/sanity/queries";
import dayjs from "dayjs";
import { Calendar } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

const BlogPage = async () => {
  const blogs = await getAllBlogs(6);

  return (
    <div className="transition-colors duration-300">
      <Container>
        <h2 className="text-lg font-semibold text-black dark:text-white">Blog page</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-5 md:mt-10">
          {blogs?.map((blog) => (
            <div key={blog?._id} className="rounded-md overflow-hidden group bg-white dark:bg-[#1a1a1a] transition-colors duration-300">
              {blog?.mainImage && (
                <Image
                  src={urlFor(blog?.mainImage).url()}
                  alt="blogImage"
                  width={500}
                  height={500}
                  className="w-full max-h-80 object-cover"
                />
              )}
              <div className="bg-gray-100 dark:bg-[#121212] p-5 transition-colors duration-300">
                <div className="text-xs flex items-center gap-5">
                  <div className="flex items-center relative group cursor-pointer">
                    {blog?.blogcategories?.map((item, index) => (
                      <p
                        key={index}
                        className="font-semibold text-shop_dark_green tracking-wider dark:text-shop-dark-yellow"
                      >
                        {item?.title}
                      </p>
                    ))}
                    <span className="absolute left-0 -bottom-1.5 bg-shop-light-bg/30 dark:bg-gray-700 inline-block w-full h-[2px] group-hover:bg-shop-dark-yellow dark:group-hover:bg-shop-golden hover:cursor-pointer hoverEffect transition-colors duration-300" />
                  </div>
                  <p className="flex items-center gap-1 text-gray-600 dark:text-gray-300 relative group hover:cursor-pointer hover:text-shop-dark-yellow dark:hover:text-shop-golden hoverEffect transition-colors duration-300">
                    <Calendar size={15} />{" "}
                    {dayjs(blog.publishedAt).format("MMMM D, YYYY")}
                    <span className="absolute left-0 -bottom-1.5 bg-shop-light-bg/30 dark:bg-gray-700 inline-block w-full h-[2px] group-hover:bg-shop-dark-yellow dark:group-hover:bg-shop-golden hoverEffect transition-colors duration-300" />
                  </p>
                </div>
                <Link
                  href={`/blog/${blog?.slug?.current}`}
                  className="text-base font-bold tracking-wide mt-5 line-clamp-2 text-black dark:text-white hover:text-shop-dark-yellow dark:hover:text-shop-golden hoverEffect transition-colors duration-300"
                >
                  {blog?.title}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
};

export default BlogPage;
