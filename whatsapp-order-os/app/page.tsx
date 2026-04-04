import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ProblemSection from "@/components/ProblemSection";
import RevenueLeakSection from "@/components/RevenueLeakSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import FeaturesSection from "@/components/FeaturesSection";
import CustomerMemorySection from "@/components/CustomerMemorySection";
import SocialProofSection from "@/components/SocialProofSection";
import FinalCTASection from "@/components/FinalCTASection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="bg-[#030711] text-slate-100 overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <RevenueLeakSection />
      <HowItWorksSection />
      <FeaturesSection />
      <CustomerMemorySection />
      <SocialProofSection />
      <FinalCTASection />
      <Footer />
    </main>
  );
}
