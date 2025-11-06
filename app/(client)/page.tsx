import Container from "@/components/ui/container";
import HomeBanner from "@/components/ui/HomeBanner";
import HomeCategories from "@/components/ui/HomeCategories";
import LatestBlog from "@/components/ui/LatestBlog";
import ProductGrid from "@/components/ui/ProductGrid";
import { getCategories } from "@/sanity/queries";
import React from "react";

const home = async () => {
  const categories =await getCategories(6);
  
  return (
    <Container>
      <HomeBanner/>
      <div className="py-10">
        <ProductGrid/>
        <HomeCategories categories={categories}/>
      </div>
      
      <LatestBlog/>
    </Container>
  );
};

export default home;
