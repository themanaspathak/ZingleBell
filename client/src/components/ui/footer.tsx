import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-gray-100 mt-auto py-8 lg:py-12 border-t">
      <div className="container mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          <div className="max-w-xl">
            <h3 className="font-semibold text-lg lg:text-xl mb-4">About Us</h3>
            <p className="text-gray-600 text-sm lg:text-base leading-relaxed">
              <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">Zingle</span>
              <span className="bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">Bell</span>
              {" "}is your premier destination for delightful dining experiences in Udaipur. 
              We pride ourselves on offering exceptional service and mouthwatering cuisine.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg lg:text-xl mb-4">Contact Us</h3>
            <div className="space-y-3 text-gray-600 text-sm lg:text-base">
              <p className="flex items-center gap-2">
                <span className="font-medium">Email:</span>
                <a href="mailto:contact@zinglebell.com" className="hover:text-primary transition-colors">
                  contact@zinglebell.com
                </a>
              </p>
              <p className="flex items-center gap-2">
                <span className="font-medium">Phone:</span>
                <a href="tel:+918769456454" className="hover:text-primary transition-colors">
                  +91 8769456454
                </a>
              </p>
              <p className="leading-relaxed">
                <span className="font-medium">Address:</span><br />
                Lake Palace Road, Near City Palace,<br />
                Udaipur, Rajasthan 313001
              </p>
            </div>
          </div>
        </div>
        <div className="mt-8 lg:mt-12 pt-8 border-t text-center text-gray-600">
          <p className="text-sm lg:text-base">
            © {new Date().getFullYear()}{" "}
            <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">Zingle</span>
            <span className="bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">Bell</span>
            . All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}