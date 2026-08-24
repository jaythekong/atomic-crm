import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Welcome = () => (
  <Card>
    <CardHeader className="px-4">
      <CardTitle>Your CRM Starter Kit</CardTitle>
    </CardHeader>
    <CardContent className="px-4">
      <p className="text-sm mb-4">
        Dalo CRM is your all-in-one tool for managing contacts, companies,
        deals, and tasks — built to keep your team aligned and your pipeline
        moving.
      </p>
      <p className="text-sm">
        Head to{" "}
        <a href="#/contacts" className="underline hover:no-underline">
          Contacts
        </a>
        ,{" "}
        <a href="#/companies" className="underline hover:no-underline">
          Companies
        </a>
        , or{" "}
        <a href="#/deals" className="underline hover:no-underline">
          Deals
        </a>{" "}
        to get started.
      </p>
    </CardContent>
  </Card>
);
