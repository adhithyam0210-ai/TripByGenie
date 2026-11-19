import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, ArrowLeft, Calendar, CheckCircle } from 'lucide-react';
import { api } from '../../services/api';
import { Destination, Package } from '../../types';
import { PackageCard } from '../../components/travel/PackageCard';
import { CustomTripModal } from '../../components/travel/CustomTripModal';
import { Button } from '../../components/common/Button';

export const DestinationDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [destination, setDestination] = useState<Destination | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);

  useEffect(() => {
    if (slug) loadDestinationData(slug);
  }, [slug]);

  const loadDestinationData = async (destinationSlug: string) => {
    setIsLoading(true);
    try {
      const data = await api.getDestinationBySlug(destinationSlug);
      setDestination(data.destination);
      setPackages(data.packages);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFDF8]">
        <div className="w-8 h-8 border-4 border-[#082C43] border-t-[#FF795C] rounded-full animate-spin" />
      </div>
    );
  }

  if (!destination) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold text-[#082C43]">Destination Not Found</h2>
        <Link to="/destinations" className="mt-3 text-sm text-[#FF795C] font-semibold underline">
          Back to all destinations
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#FFFDF8] min-h-screen pb-20">
      {/* Destination Hero */}
      <div className="relative h-96 sm:h-[450px] bg-[#041D30] text-white overflow-hidden">
        <img
          src={destination.image}
          alt={destination.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#041D30] via-[#041D30]/50 to-transparent" />

        <div className="absolute inset-0 flex flex-col justify-between max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 py-8">
          <div>
            <Link
              to="/destinations"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/80 hover:text-white bg-black/40 backdrop-blur-xs px-3 py-1.5 rounded-full"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Destinations</span>
            </Link>
          </div>

          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#55C9BD] bg-[#082C43]/80 px-2.5 py-0.5 rounded-full border border-white/20">
                {destination.region}
              </span>
              <span className="text-xs text-white/80 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#FF795C]" />
                {destination.country}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold font-display">
              {destination.name}
            </h1>

            <p className="text-sm sm:text-base text-white/90 leading-relaxed font-normal">
              {destination.description}
            </p>
          </div>
        </div>
      </div>

      {/* Available Packages in this destination */}
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 pt-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#EFE7DA] gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#082C43] font-display">
              Holidays & Packages in {destination.name}
            </h2>
            <p className="text-xs text-[#173247]/70 mt-0.5">
              Showing {packages.length} handpicked tour itineraries
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setSelectedPackage(null);
              setIsTripModalOpen(true);
            }}
          >
            Custom Quote for {destination.name}
          </Button>
        </div>

        {packages.length === 0 ? (
          <div className="text-center py-16 bg-[#F8F1E7]/50 rounded-2xl border border-[#EFE7DA] mt-6">
            <h3 className="text-base font-bold text-[#082C43]">
              No pre-packaged tours listed for {destination.name}
            </h3>
            <p className="text-xs text-[#173247]/70 mt-1 max-w-md mx-auto">
              Our travel consultants can create a completely customized itinerary tailored to your exact dates and budget.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={() => setIsTripModalOpen(true)}
            >
              Plan Custom {destination.name} Trip
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {packages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                packageData={pkg}
                onEnquire={(p) => {
                  setSelectedPackage(p);
                  setIsTripModalOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Trip Modal */}
      <CustomTripModal
        isOpen={isTripModalOpen}
        onClose={() => setIsTripModalOpen(false)}
        initialDestination={selectedPackage ? selectedPackage.title : destination.name}
        initialPackageId={selectedPackage ? selectedPackage.id : ''}
      />
    </div>
  );
};
