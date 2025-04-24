import Manager from "@/components/svg/Manager";
import Person from "@/components/svg/Person";
import Staff from "@/components/svg/Staff";
import Supervisor from "@/components/svg/Supervisor";
import Technician from "@/components/svg/Technician";
import { DepartmentRole } from "@/utils/models";

export function getArabicDepartmentRole(role: DepartmentRole) {
  switch (role) {
    case DepartmentRole.STAFF:
      return "موظف";
    case DepartmentRole.MANAGER:
      return "مدير";
    case DepartmentRole.SUPERVISOR:
      return "مشرف";
    case DepartmentRole.TECHNICIAN:
      return "تقني";
    default:
      return "مستقل";
  }
}

export function getDepartmentRoleIcon(role: DepartmentRole) {
  switch (role) {
    case DepartmentRole.STAFF:
      return Staff;
    case DepartmentRole.MANAGER:
      return Manager;
    case DepartmentRole.SUPERVISOR:
      return Supervisor;
    case DepartmentRole.TECHNICIAN:
      return Technician;
    default:
      return Person;
  }
}

export function getDepartmentRoleColor(role: DepartmentRole): string {
  switch (role) {
    case DepartmentRole.STAFF:
      return "#4B9CD3"; // blue
    case DepartmentRole.MANAGER:
      return "#F5A623"; // orange
    case DepartmentRole.SUPERVISOR:
      return "#7ED321"; // green
    case DepartmentRole.TECHNICIAN:
      return "#BD10E0"; // purple
    default:
      return "#9B9B9B"; // gray
  }
}
