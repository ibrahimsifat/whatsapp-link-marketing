import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageCircle, FileSpreadsheet, CheckCircle } from "lucide-react"

export function InstructionsSection() {
  return (
    <Card className="bg-white border border-slate-200 shadow-none">
      <CardHeader className="border-b border-slate-200 p-4 sm:p-5">
        <CardTitle className="text-slate-800 flex items-center gap-3 text-lg sm:text-xl">
          <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-lg flex-shrink-0">
            <MessageCircle className="h-5 w-5 text-emerald-600" />
          </div>
          How to use Business Templates
        </CardTitle>
      </CardHeader>
      <CardContent className="text-slate-700 p-4 sm:p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-lg flex-shrink-0">
                <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 mb-1">Excel/CSV Columns:</p>
                <p className="text-sm text-slate-600">
                  Phone, Company Name, Category, Website, and any custom columns you add!
                </p>
              </div>
            </div>

          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-lg flex-shrink-0">
                <MessageCircle className="h-5 w-5 text-emerald-600" />
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
              <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-lg flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
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
