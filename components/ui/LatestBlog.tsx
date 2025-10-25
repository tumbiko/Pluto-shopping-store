import React from 'react'
import { getLatestBlogs } from '@/sanity/queries'
import Image from 'next/image';
import { urlFor } from '@/sanity/lib/image';
import Link from 'next/link';
import { Calendar } from 'lucide-react';
import dayjs from 'dayjs';

const LatestBlog = async() => {
    const blogs = await getLatestBlogs();
  return (
    <div>
    <h2 className='border-b text-2xl pb-3 font-bold font-sans text-shop-dark-yellow capitalize tracking-wide'>Latest Blogs</h2>
    <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 mt-4'>
        {blogs?.map((blog)=>(
            <div key={blog._id} className='overflow-hidden rounded-lg'>
                {blog.mainImage && <Link href={`/blog/${blog?.slug?.current}`}>
                <div style={{ height: '200px', position: 'relative' }}>
                <Image src={urlFor(blog?.mainImage).url()}
                alt="blog image"
                fill
                style={{ objectFit: 'cover' }}
                className='w-full'
                />
                </div>
                </Link>}
                <div className='bg-shop-light-bg p-5'>
                    <div className='text-xs flex items-center gap-5'>
                        <div className='flex items-center relative group cursor-pointer'>
                            {blog?.blogcategories?.map((item,index)=>(
                                <p className=' tracking-wider p-0.5' key={index}>
                                    {item?.title}
                                </p>
                            ))}
                            <span className='absolute left-0 bottom-0 bg-gray-500
                            inline-block w-full h-[2px] group-hover:bg-shop-dark-yellow hover:cursor-pointer
                            hoverEffect'/>
                        </div>
                        <p className="flex items-center gap-1 text-gray-500 relative group hover:cursor-pointer hover:text-shop_dark_green hoverEffect p-0.5">
                  <Calendar size={15} />{" "}
                  {dayjs(blog.publishedAt).format("MMMM D, YYYY")}
                  <span className="absolute left-0 bottom-0 bg-gray-500 inline-block
                  w-full h-[2px] group-hover:bg-shop-dark-yellow hoverEffect" />
                </p>
                    </div>
                    <Link href={`/blog/${blog?.slug?.current}`} className='text-sm tracking-wide mt-5 line-clamp-2'>
                        {blog?.title}
                    </Link>
                </div>
            </div>
        ))}
    </div>
    </div>
  )
}

export default LatestBlog