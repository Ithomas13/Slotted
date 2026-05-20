import { auth, calendar } from "@googleapis/calendar";
import type { calendar_v3 } from "@googleapis/calendar";

export function createCalendarClient(accessToken: string): calendar_v3.Calendar {
  const oauth2Client = new auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return calendar({ version: "v3", auth: oauth2Client }) as unknown as calendar_v3.Calendar;
}
