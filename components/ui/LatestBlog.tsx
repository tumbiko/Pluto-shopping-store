import React from 'react';
import { getLatestBlogs } from '@/sanity/queries';
import Image from 'next/image';
import { urlFor } from '@/sanity/lib/image';
import Link from 'next/link';
import { Calendar } from 'lucide-react';
import dayjs from 'dayjs';

const LatestBlog = async () => {
  const blogs = await getLatestBlogs();

  return (
    <div className="transition-colors duration-300">
      {/* Section Title */}
      <h2 className="border-b text-2xl pb-3 font-bold font-sans text-shop-dark-yellow dark:text-shop-golden capitalize tracking-wide">
        Latest Blogs
      </h2>

      {/* Blog Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
        {blogs?.map((blog) => (
          <div
            key={blog._id}
            className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#121212] transition-all duration-300 hover:shadow-lg hover:border-shop-golden"
          >
            {/* Blog Image */}
            {blog.mainImage && (
              <Link href={`/blog/${blog?.slug?.current}`}>
                <div style={{ height: '200px', position: 'relative' }}>
                  <Image
                    src={urlFor(blog?.mainImage).url()}
                    alt="blog image"
                    fill
                    style={{ objectFit: 'cover' }}
                    className="w-full transition-transform duration-500 hover:scale-105"
                  />
                </div>
              </Link>
            )}

            {/* Blog Info */}
            <div className="bg-shop-light-bg dark:bg-[#1a1a1a] p-5 transition-colors duration-300">
              <div className="text-xs flex items-center gap-5">
                {/* Category */}
                <div className="flex items-center relative group cursor-pointer">
                  {blog?.blogcategories?.map((item, index) => (
                    <p
                      className="tracking-wider p-0.5 text-gray-700 dark:text-gray-300"
                      key={index}
                    >
                      {item?.title}
                    </p>
                  ))}
                  <span className="absolute left-0 bottom-0 bg-gray-400 dark:bg-gray-600 inline-block w-full h-[2px] group-hover:bg-shop-dark-yellow dark:group-hover:bg-shop-golden hoverEffect" />
                </div>

                {/* Date */}
                <p className="flex items-center gap-1 text-gray-500 dark:text-gray-400 relative group hover:text-shop_dark_green dark:hover:text-shop-golden hoverEffect p-0.5">
                  <Calendar size={15} />
                  {dayjs(blog.publishedAt).format('MMMM D, YYYY')}
                  <span className="absolute left-0 bottom-0 bg-gray-400 dark:bg-gray-600 inline-block w-full h-[2px] group-hover:bg-shop-dark-yellow dark:group-hover:bg-shop-golden hoverEffect" />
                </p>
              </div>

              {/* Title */}
              <Link
                href={`/blog/${blog?.slug?.current}`}
                className="text-sm tracking-wide mt-5 line-clamp-2 text-gray-800 dark:text-gray-200 hover:text-shop-dark-yellow dark:hover:text-shop-golden transition-colors duration-300"
              >
                {blog?.title}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LatestBlog;
