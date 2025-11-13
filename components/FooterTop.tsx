import { Clock, Mail, MapPin, Phone } from "lucide-react";
import React from "react";
import Container from "./Container";

interface ContactItemData {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

const data: ContactItemData[] = [
  {
    title: "Visit Us",
    subtitle: "Mzuzu, Malawi",
    icon: (
      <MapPin className="h-6 w-6 text-gray-600 dark:text-gray-300 group-hover:text-shop-dark-yellow dark:group-hover:text-shop-golden transition-colors" />
    ),
  },
  {
    title: "Contact Us",
    subtitle: "+265 992 047 025",
    icon: (
      <Phone className="h-6 w-6 text-gray-600 dark:text-gray-300 group-hover:text-shop-dark-yellow dark:group-hover:text-shop-golden transition-colors" />
    ),
  },
  {
    title: "Working Hours",
    subtitle: "Mon - Sat: 10:00 AM - 7:00 PM",
    icon: (
      <Clock className="h-6 w-6 text-gray-600 dark:text-gray-300 group-hover:text-shop-dark-yellow dark:group-hover:text-shop-golden transition-colors" />
    ),
  },
  {
    title: "Email Us",
    subtitle: "vitumbiko2121@gmail.com",
    icon: (
      <Mail className="h-6 w-6 text-gray-600 dark:text-gray-300 group-hover:text-shop-dark-yellow dark:group-hover:text-shop-golden transition-colors" />
    ),
  },
];

const FooterTop = () => {
  return (
    <Container>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 px-8 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
        {data?.map((item, index) => (
          <div
            key={index}
            className="flex items-start gap-3 group hover:bg-gray-50 dark:hover:bg-[#1a1a1a] p-4 rounded-md transition-colors duration-300 min-h-16"
          >
            {item?.icon}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-shop-dark-yellow dark:group-hover:text-shop-golden transition-colors duration-300">
                {item?.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors duration-300">
                {item?.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
};

export default FooterTop;
