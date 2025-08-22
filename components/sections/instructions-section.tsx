import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageCircle, FileSpreadsheet, Search, CheckCircle } from "lucide-react"

export function InstructionsSection() {
  return (
    <Card className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-0 shadow-xl">
      <CardHeader className="border-b border-blue-100">
        <CardTitle className="text-slate-800 flex items-center gap-3 text-xl">
          <div className="p-2 bg-blue-100 rounded-lg">
            <MessageCircle className="h-5 w-5 text-blue-600" />
          </div>
          How to use Business Templates
        </CardTitle>
      </CardHeader>
      <CardContent className="text-slate-700 p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg flex-shrink-0">
                <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 mb-1">Excel/CSV Columns:</p>
                <p className="text-sm text-slate-600">
                  Phone, Company Name, Category, Website, and any custom columns you add!
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                <Search className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 mb-1">Advanced Search:</p>
                <p className="text-sm text-slate-600">Use multiple criteria and save your search queries</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <MessageCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 mb-1">Template Variables:</p>
                <p className="text-sm text-slate-600">
                  {"{companyName}"}, {"{companyCategory}"}, {"{website}"}, and your custom column headers like
                  {"{contactPerson}"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 mb-1">Bulk Operations:</p>
                <p className="text-sm text-slate-600">Select multiple contacts for bulk export or deletion</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
