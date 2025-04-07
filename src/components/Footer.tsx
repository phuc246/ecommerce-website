"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FooterData } from "@/app/api/admin/footer/route";

export default function Footer() {
  const [footerData, setFooterData] = useState<FooterData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    fetchFooter();
  }, []);

  const fetchFooter = async () => {
    try {
      const response = await fetch("/api/admin/footer");
      if (!response.ok) throw new Error("Failed to fetch footer");
      const data = await response.json();
      
      if (data?.value) {
        try {
          const parsedData = JSON.parse(data.value);
          setFooterData(parsedData);
        } catch (e) {
          console.error("Error parsing footer data:", e);
          setHasError(true);
        }
      }
    } catch (error) {
      console.error("Error fetching footer:", error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback footer in case of errors or while loading
  const renderFallbackFooter = () => (
    <footer className="bg-gray-800 text-white py-10 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
              Về chúng tôi
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-300 hover:text-white hover:underline transition-colors">
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-gray-300 hover:text-white hover:underline transition-colors">
                  Sản phẩm
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
              Liên hệ
            </h3>
            <ul className="space-y-2">
              <li className="text-gray-300">
                Email: info@example.com
              </li>
              <li className="text-gray-300">
                Điện thoại: 123-456-7890
              </li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
              Theo dõi chúng tôi
            </h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-300 hover:text-white hover:underline transition-colors">
                  Facebook
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white hover:underline transition-colors">
                  Instagram
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-10 pt-8 text-sm text-gray-400 text-center">
          <p>© {new Date().getFullYear()} E-commerce Website. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );

  if (isLoading || hasError || !footerData) {
    return renderFallbackFooter();
  }

  // Validate footer data before rendering
  const isValidFooter = 
    footerData && 
    Array.isArray(footerData.columns) && 
    footerData.columns.length > 0;

  if (!isValidFooter) {
    return renderFallbackFooter();
  }

  return (
    <footer className="bg-gray-800 text-white py-10 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {footerData.columns.map((column, index) => (
            <div key={index} className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
                {column.title}
              </h3>
              {Array.isArray(column.links) && column.links.length > 0 ? (
                <ul className="space-y-2">
                  {column.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <Link 
                        href={link.url || "#"} 
                        className="text-gray-300 hover:text-white hover:underline transition-colors" 
                        target={link.url && link.url.startsWith("http") ? "_blank" : "_self"}
                        rel={link.url && link.url.startsWith("http") ? "noopener noreferrer" : ""}
                      >
                        {link.text || "Link"}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 text-sm">Không có liên kết</p>
              )}
            </div>
          ))}
        </div>
        
        <div className="border-t border-gray-700 mt-10 pt-8 text-sm text-gray-400 text-center">
          <p>© {new Date().getFullYear()} E-commerce Website. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
} 