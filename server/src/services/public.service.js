/**
 * Public Landing Data Service
 * Strictly enforces zero-leakage of B2B wholesale prices to the public
 */

const bannerRepository = require('../repositories/banner.repository');
const packageRepository = require('../repositories/package.repository');

class PublicService {
  async getLandingData() {
    const [banners, packages] = await Promise.all([
      bannerRepository.findActiveOrdered(),
      packageRepository.findAllActivePublic()
    ]);

    // Group destinations for navigation menus
    const destinations = Array.from(new Set(packages.map(p => p.destination).filter(Boolean))).map(name => {
      const pkgs = packages.filter(p => p.destination === name);
      return {
        name,
        package_count: pkgs.length,
        starting_price: Math.min(...pkgs.map(p => p.b2c_price || 0))
      };
    });

    return {
      hero_banners: banners,
      packages: packages, // guaranteed b2c_price only
      destinations: destinations
    };
  }
}

module.exports = new PublicService();
