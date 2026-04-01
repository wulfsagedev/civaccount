#!/usr/bin/env python3
"""Restore hand-written top_suppliers descriptions that were accidentally removed.

Restores 95 descriptions for 5 councils in county-councils.ts:
- Kent (20), Essex (19), East Sussex (19), Derbyshire (17), Gloucestershire (20)
"""

import re

# The exact descriptions to restore, keyed by supplier name
DESCRIPTIONS = {
    "Kent": {
        "Medway Council": "KCC shares back-office services with Medway Council and funds education services including school budgets and SEND provision through a shared purchasing framework.",
        "Amey Highways": "Holds the Highways Term Maintenance Contract covering road repairs, pothole fixing, winter gritting and bridge maintenance across Kent's local road network.",
        "Kier Highways": "Payments relate to the strategic road network in Kent and Sussex (major routes including the M2, M20, A2, A20). This covers national highways managed by National Highways, not KCC's local roads.",
        "Cantium Business Solutions": "A company wholly owned by KCC. Provides managed IT services, cybersecurity, schools IT systems, and digital services to KCC and other public sector bodies.",
        "Gen2 Property": "A company wholly owned by KCC. Manages the council's property portfolio including schools, libraries and office buildings. Provides asset management, property maintenance and capital project delivery.",
        "Agilisys": "Runs KCC's digital services and customer contact centre. Provides the online systems residents use to access council services and handles telephone enquiries.",
        "The Education People": "Provides education support services to Kent's maintained schools on behalf of KCC, covering governor services, professional development, safeguarding training, school improvement and initial teacher training.",
        "UK Power Networks": "The electricity distribution network operator for the area. KCC payments cover electricity supply for council buildings, street lighting energy and new connection works.",
        "Cumberlege Eden & Partners": "Provides health and social care consultancy services. Specific details of the KCC contract scope are not published in available transparency documents.",
        "Peabody South East": "A housing association providing supported housing and care services. KCC payments cover placements and support for residents in social housing with care needs.",
        "Kent & Medway NHS": "Covers joint health and social care services between KCC and the NHS, including mental health services, community health partnerships and integrated care arrangements.",
        "Balfour Beatty": "Delivers capital construction projects and infrastructure work for KCC, including building and refurbishment of council facilities.",
        "Biffa Waste Services": "Manages household waste and recycling centres and waste transfer stations for KCC. Handles recyclable materials haulage and reprocessing.",
        "Stagecoach South East": "Operates bus services across Kent. KCC subsidises routes that are not commercially viable but serve rural areas, evenings and weekends. Also provides contracted school transport services.",
        "Arriva Southern Counties": "Operates local and interurban bus services across Kent. Provides both commercial routes and KCC-subsidised services in areas where bus routes would otherwise not run. Also delivers contracted school transport.",
        "Avante Care & Support": "A not-for-profit care provider operating care homes in Kent. Provides nursing care, dementia care, respite care and home care services. KCC funds placements for residents whose care is council-funded.",
        "Shaw Healthcare": "An employee-owned healthcare provider running care homes. Provides residential care, nursing care, dementia care and complex care services. KCC funds placements for eligible residents.",
        "Opus People Solutions": "A public sector recruitment provider supplying agency workers to KCC to fill vacancies across council services, particularly in social work, education and administrative roles.",
        "BT Group": "Provides telephone and broadband infrastructure, network services and connectivity for KCC offices, schools and other council buildings.",
        "Sevenoaks District Council": "KCC shares certain services with Sevenoaks District Council under a partnership arrangement covering back-office functions.",
    },
    "Derbyshire": {
        "Associated Waste Management Ltd": "Waste collection, disposal and treatment services across Derbyshire household waste recycling centres.",
        "Senad Ltd": "Specialist residential and educational placements for children with complex special educational needs.",
        "Derbyshire Community Health Services": "Community health and social care services delivered through NHS partnership arrangements.",
        "Holdsworth Food Service": "School meals catering contract providing meals across Derbyshire schools.",
        "EMH Group": "Residential and nursing care home placements for older people and adults with care needs.",
        "Derby and Derbyshire ICB": "Integrated care board payments for joint health and social care commissioning including home care.",
        "Comensura Ltd": "Managed service provider for agency and temporary staffing across council departments.",
        "Medequip Assistive Technology Ltd": "Assistive technology and equipment provision supporting independent living for adults.",
        "Equitix Education Derbyshire Ltd": "PFI contract for education infrastructure including school buildings maintenance.",
        "Eastwood Grange": "Residential children's care and specialist education placements.",
        "Concertus Derbyshire Limited": "Property and capital programme delivery including building maintenance and construction.",
        "Biffa Treatment Services": "Waste treatment, processing and disposal services at specialist treatment facilities.",
        "North East Derbyshire District Council": "Inter-authority payments for environmental services and shared service arrangements.",
        "Stagecoach Services Ltd": "Bus operator reimbursement for concessionary fares and subsidised route contracts.",
        "Smoothstone Care and Education Ltd": "Special educational needs schools and college placements for children with complex needs.",
        "H W Martin Waste Limited": "Waste management, skip hire and recycling services for council operations.",
        "Eden Supported Living Ltd": "Supported living schemes enabling adults with disabilities to live independently in the community.",
    },
    "East Sussex": {
        "South Downs Waste Services": "Waste disposal, tipping, recycling and waste treatment services across the county.",
        "HMRC (Inland Revenue)": "National Insurance contributions for council staff including education support staff, teachers and local government employees.",
        "Balfour Beatty Living Places": "Highways maintenance contract including road repairs, winter management, resurfacing and routine maintenance across East Sussex.",
        "East Sussex Pensions Fund": "Unfunded teachers pensions, unfunded pensions and injury allowance payments to the county pension fund.",
        "Stagecoach Services": "Bus operator reimbursement including concessionary travel, contracted passenger transport services and route subsidies.",
        "Change Grow Live": "Substance misuse treatment, domestic abuse services and short-term community support contracts.",
        "Peacehaven Schools Limited": "Hired and contract services for schools including contract catering and free school meals provision.",
        "East Sussex Healthcare NHS Trust": "Contracts for health services, joint health and social care commissioning, and general health body payments.",
        "24x7 Limited": "Vehicle hire, plant hire and specialist transport services including accessible transport provision.",
        "Eastbourne Borough Council": "Inter-authority payments for shared services, waste collection, and general local authority partnership costs.",
        "Kent Community Health NHS": "Community health services contracts including health visiting, school nursing and community wellbeing programmes.",
        "London South East Academies Trust": "SEN high needs top-up payments, consultancy fees and contracted works for academy trust provision.",
        "Adecco UK": "Agency staffing services providing temporary and contract workers across council departments.",
        "Brighton & Hove Bus & Coach Co": "Bus operator reimbursement for concessionary travel and contracted passenger transport routes.",
        "EDF Energy": "Electricity supply contract for council buildings, schools, street lighting and operational facilities.",
        "NSL Ltd": "Parking enforcement and civil enforcement contract covering on-street and off-street parking management.",
        "NHS Sussex ICB": "Integrated care board payments for joint health commissioning, Better Care Fund and health partnership agreements.",
        "Wrixon Care Services": "Children's residential care, adoption support, agency staffing and escort services for looked-after children.",
        "Morgan Sindall PLC": "Construction and capital works including school building projects, consultant fees and contracted building works.",
    },
    "Essex": {
        "Ringway Jacobs Ltd": "Highways maintenance and capital infrastructure projects across the Essex road network. Q4 2025 actual: £44.4m.",
        "Southend-on-Sea City Council": "Business rates pool redistribution and grant contributions to Southend. Q4 2025 actual: £42.0m.",
        "Essex PFCC FRA": "Business rates pool payments to Essex Police, Fire and Crime Commissioner. Q4 2025 actual: £32.0m.",
        "Direct Payment (Adult Social Care)": "Direct payments enabling adults to arrange their own care and support. Q4 2025 actual: £18.9m.",
        "Indaver Rivenhall Ltd": "Waste disposal and treatment services at the Rivenhall facility. Q4 2025 actual: £12.9m.",
        "Mitie Ltd": "Facilities management and related services. Q4 2025 actual: £12.9m.",
        "Octavius Infrastructure Ltd": "Highways and infrastructure capital construction projects. Q4 2025 actual: £11.3m.",
        "Runwood Homes Ltd": "Residential care home placements for older people and adults. Q4 2025 actual: £11.1m.",
        "HCRG Care Services Ltd": "Third-party children's and families services including health visiting and school nursing. Q4 2025 actual: £9.7m.",
        "Essex Cares Ltd": "Reablement and short-term support contracts helping adults regain independence. Q4 2025 actual: £8.8m.",
        "Provide Community Interest Company": "Community health and care services funded through the Better Care Fund. Q4 2025 actual: £8.2m.",
        "24 x 7 Ltd": "Hired transport services including school and social care transport. Q4 2025 actual: £7.9m.",
        "Training Bursary (Education DSG)": "Training bursary grants funded through the Dedicated Schools Grant. Q4 2025 actual: £7.5m.",
        "Foster Care Payment": "Payments to foster carers providing placements for looked-after children. Q4 2025 actual: £7.3m.",
        "NHS Mid and South Essex ICB": "Integrated care partnership payments through the Better Care Fund. Q4 2025 actual: £5.5m.",
        "East Suffolk & North Essex NHS FT": "Domiciliary care contracts delivered through NHS foundation trust partnership. Q4 2025 actual: £4.7m.",
        "Lee Valley Regional Park Authority": "Statutory levy contribution to Lee Valley Regional Park Authority. Q4 2025 actual: £4.4m.",
        "Bouygues (UK) Ltd": "Construction and capital infrastructure projects. Q4 2025 actual: £3.9m.",
        "Matrix SCM Ltd": "Managed service provider for agency and temporary staffing across adult social care. Q4 2025 actual: £3.8m.",
    },
    "Gloucestershire": {
        "UBB (Gloucestershire) Ltd": "Operates the Javelin Park Energy from Waste facility under a long-term PFI-style contract \\u2014 the council\\u2019s single largest contract.",
        "Ringway Infrastructure Services Ltd": "Term maintenance contract for roads, drainage and bridges (\\u00a3245m contract, 2019\\u20132030).",
        "AtkinsRealis UK Limited": "Design, transport planning and infrastructure consultancy under a long-term term contract.",
        "Wills Bros Civil Engineering": "Major civil engineering and highways improvement projects.",
        "Comensura Limited": "Managed service provider for interim and agency staff across all service areas.",
        "Blue3 (Gloucestershire Fire)": "PFI contract for fire station provision and maintenance.",
        "Auriga Services Ltd": "Administers welfare assistance and professional support services.",
        "Action for Children": "Social care, family services and children's agency placements.",
        "Tarmac Trading Ltd": "Road surfacing term contract.",
        "Within Reach Services Limited": "Residential care for looked-after children.",
        "Gloucestershire Health and Care NHS Foundation Trust": "Joint health and social care services.",
        "Barnardo's": "Family support and early intervention.",
        "Kingshood Support Ltd": "Residential care and support packages.",
        "Aspris Children's Services": "Independent school placements for children with SEND.",
        "Acorn Care & Education Ltd": "Independent special school placements.",
        "Connections 2 Independence Ltd": "Social care supported living and education.",
        "Cantium Business Solutions Ltd": "Technology platform and business support.",
        "Connected Kerb Ltd": "EV charging infrastructure deployment.",
        "BT PLC": "Voice and data infrastructure, networking.",
        "Dell Corporation Ltd": "Computer hardware, servers and equipment supply.",
    },
}

FILE_PATH = "src/data/councils/county-councils.ts"

def restore_descriptions():
    with open(FILE_PATH, "r") as f:
        content = f.read()

    total_restored = 0

    for council_name, suppliers in DESCRIPTIONS.items():
        council_restored = 0

        for supplier_name, description in suppliers.items():
            # Escape special regex chars in supplier name
            escaped_name = re.escape(supplier_name)

            # Match the supplier entry WITHOUT a description field
            # Pattern: { name: "SupplierName", annual_spend: XXXX, category: "YYY" }
            # We need to add description before the closing }
            pattern = (
                r'(\{\s*name:\s*"' + escaped_name + r'"'
                r',\s*annual_spend:\s*\d+'
                r',\s*category:\s*"[^"]*")'
                r'(\s*\})'
            )

            # Check if this supplier already has a description (shouldn't, but be safe)
            check_pattern = r'name:\s*"' + escaped_name + r'"[^}]*description:'
            if re.search(check_pattern, content):
                print(f"  SKIP {council_name}/{supplier_name} - already has description")
                continue

            # Escape the description for the replacement string
            escaped_desc = description.replace('\\', '\\\\').replace('"', '\\"')

            replacement = r'\1, description: "' + escaped_desc + r'"\2'

            new_content = re.sub(pattern, replacement, content, count=1)

            if new_content != content:
                content = new_content
                council_restored += 1
                total_restored += 1
            else:
                print(f"  MISS {council_name}/{supplier_name} - pattern not found")

        print(f"{council_name}: restored {council_restored}/{len(suppliers)} descriptions")

    with open(FILE_PATH, "w") as f:
        f.write(content)

    print(f"\nTotal restored: {total_restored}")

if __name__ == "__main__":
    restore_descriptions()
