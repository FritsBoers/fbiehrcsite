$xmlPath = "c:\Users\FritsBoers\Documents\HRCSite\fbiehrcsite\data\locations-template.xml"
$jsonPath = "c:\Users\FritsBoers\Documents\HRCSite\fbiehrcsite\data\locations.json"

[xml]$doc = Get-Content $xmlPath -Raw -Encoding UTF8

$ns = New-Object System.Xml.XmlNamespaceManager($doc.NameTable)
$ns.AddNamespace("ss", "urn:schemas-microsoft-com:office:spreadsheet")

$rows = $doc.SelectNodes("//ss:Worksheet[@ss:Name='Locations']/ss:Table/ss:Row", $ns)

function Get-RowValues($row) {
    $vals = @{}
    $col = 1
    foreach ($cell in $row.SelectNodes("ss:Cell", $ns)) {
        $idx = $cell.GetAttribute("Index", "urn:schemas-microsoft-com:office:spreadsheet")
        if ($idx) { $col = [int]$idx }
        $data = $cell.SelectSingleNode("ss:Data", $ns)
        $vals[$col] = if ($data) { $data.InnerText } else { "" }
        $col++
    }
    return $vals
}

function Escape-Json($s) {
    if (-not $s) { return "" }
    return $s.Replace('\', '\\').Replace('"', '\"').Replace("`n", '\n').Replace("`r", '\r').Replace("`t", '\t')
}

function Split-Pipe($s) {
    if (-not $s) { return @() }
    return @($s -split '\|' | ForEach-Object { $_.Trim() } | Where-Object { $_ })
}

function To-JsonArray($items) {
    if (-not $items -or $items.Count -eq 0) { return "[]" }
    $parts = $items | ForEach-Object { "`"$(Escape-Json $_)`"" }
    return "[$($parts -join ', ')]"
}

$entries = @()

for ($i = 1; $i -lt $rows.Count; $i++) {
    $v = Get-RowValues $rows[$i]

    $id = $v[1]
    if (-not $id) { continue }

    $name = Escape-Json $v[2]
    $type = if ($v[3]) { $v[3].ToLower() } else { "cafe" }
    $city = Escape-Json $v[4]
    $country = Escape-Json $v[5]
    $continent = if ($v[6]) { $v[6] } else { "" }

    $lat = if ($v[7]) { $v[7] } else { "0" }
    $lng = if ($v[8]) { $v[8] } else { "0" }

    $visitDates = Split-Pipe $v[9]
    $visitDateJson = To-JsonArray $visitDates

    $plannedDate = if ($v[10]) { "`"$($v[10])`"" } else { "null" }
    $status = if ($v[11]) { $v[11].ToLower() } else { "visited" }

    $isClosed = if ($v[12] -eq "1" -or $v[12] -eq "TRUE" -or $v[12] -eq "true") { "true" } else { "false" }

    $pinsFiles = @(Split-Pipe $v[13])
    $pinsExpanded = @($pinsFiles | ForEach-Object { if ($_ -match '/') { $_ } else { "images/locations/$id/pins/$_" } })
    $pinsJson = To-JsonArray $pinsExpanded

    $tshirtsFiles = @(Split-Pipe $v[14])
    $tshirtsExpanded = @($tshirtsFiles | ForEach-Object { if ($_ -match '/') { $_ } else { "images/locations/$id/tshirts/$_" } })
    $tshirtsJson = To-JsonArray $tshirtsExpanded

    $photosFiles = @(Split-Pipe $v[15])
    $photosExpanded = @($photosFiles | ForEach-Object { if ($_ -match '/') { $_ } else { "images/locations/$id/photos/$_" } })
    $photosJson = To-JsonArray $photosExpanded

    $notes = Escape-Json $v[16]
    $favorite = if ($v[17] -eq "1" -or $v[17] -eq "TRUE" -or $v[17] -eq "true") { "true" } else { "false" }

    $entry = "  {
    `"id`": `"$id`",
    `"name`": `"$name`",
    `"type`": `"$type`",
    `"city`": `"$city`",
    `"country`": `"$country`",
    `"continent`": `"$continent`",
    `"lat`": $lat,
    `"lng`": $lng,
    `"visitDate`": $visitDateJson,
    `"plannedDate`": $plannedDate,
    `"status`": `"$status`",
    `"isClosed`": $isClosed,
    `"pins`": $pinsJson,
    `"tshirts`": $tshirtsJson,
    `"photos`": $photosJson,
    `"notes`": `"$notes`",
    `"favorite`": $favorite
  }"

    $entries += $entry
}

$json = "[$([Environment]::NewLine)$($entries -join ",$([Environment]::NewLine)")$([Environment]::NewLine)]"
[System.IO.File]::WriteAllText($jsonPath, $json, (New-Object System.Text.UTF8Encoding $false))
Write-Host "Converted $($entries.Count) locations to locations.json"
