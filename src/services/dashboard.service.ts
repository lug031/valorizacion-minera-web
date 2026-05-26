import { adminDataClient } from "@/lib/amplify/data-client";
import { listStaffUsers } from "@/services/staff-user.service";

const COUNT_LIMIT = 500;

export interface DashboardCount {
  count: number;
  capped: boolean;
}

export interface DashboardCounts {
  maquilaRanges: DashboardCount;
  materialTypes: DashboardCount;
  providers: DashboardCount;
  valuations: DashboardCount;
  staffUsers: DashboardCount;
}

async function countList(
  list: () => Promise<{ data?: unknown[] | null; nextToken?: string | null; errors?: { message: string }[] }>
): Promise<DashboardCount> {
  const { data, nextToken, errors } = await list();
  if (errors?.length) {
    throw new Error(errors.map((e) => e.message).join("; "));
  }
  const count = data?.length ?? 0;
  return { count, capped: Boolean(nextToken) };
}

export async function getDashboardCounts(): Promise<DashboardCounts> {
  const [maquilaRanges, materialTypes, providers, valuations, staffUsersList] = await Promise.all([
    countList(() =>
      adminDataClient.models.MaquilaRange.list({ limit: COUNT_LIMIT })
    ),
    countList(() =>
      adminDataClient.models.MaterialType.list({ limit: COUNT_LIMIT })
    ),
    countList(() =>
      adminDataClient.models.Provider.list({ limit: COUNT_LIMIT })
    ),
    countList(() =>
      adminDataClient.models.Valuation.list({ limit: COUNT_LIMIT })
    ),
    listStaffUsers(),
  ]);

  const staffCount = staffUsersList.length;
  return {
    maquilaRanges,
    materialTypes,
    providers,
    valuations,
    staffUsers: { count: staffCount, capped: staffCount >= COUNT_LIMIT },
  };
}

export function formatDashboardCount({ count, capped }: DashboardCount): string {
  if (capped) return `${count}+`;
  return String(count);
}
