import { useMemo } from "react";
import { useTenant } from "../../contexts/TenantContext";
import DefaultTemplate from "./templates/DefaultTemplate";
import CarRentalTemplate from "./templates/CarRentalTemplate";
import HotelTemplate from "./templates/HotelTemplate";

const TenantThemeRouter = () => {
  const { tenant } = useTenant();

  const theme = useMemo(() => tenant?.theme || "default", [tenant?.theme]);

  if (theme === "car-rental") return <CarRentalTemplate />;
  if (theme === "hotel") return <HotelTemplate />;
  return <DefaultTemplate />;
};

export default TenantThemeRouter;

