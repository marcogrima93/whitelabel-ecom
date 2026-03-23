export default function AdminSettingsPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Site Settings</h1>
      <p className="text-muted-foreground mb-4">
        Site-wide settings are configured in <code className="bg-muted px-1 py-0.5 rounded text-sm">site.config.ts</code> at the project root.
        For dynamic settings that persist to the database, extend this page to read/write from the <code className="bg-muted px-1 py-0.5 rounded text-sm">site_settings</code> table.
      </p>
      <div className="border rounded-lg p-4 bg-muted/30">
        <h3 className="font-medium mb-2">Current Config Location</h3>
        <code className="text-sm">site.config.ts</code>
        <p className="text-sm text-muted-foreground mt-1">
          Edit this file to change store name, currency, tax rate, shipping rates, social links, and feature flags.
        </p>
      </div>
    </div>
  );
}
