Add-Type -AssemblyName System.IO.Compression.FileSystem

$inputFile = (Get-ChildItem (Join-Path $PSScriptRoot '..') -Recurse -Filter 'Relat*.xlsx' | Where-Object { $_.Name -notlike 'Chamada*' } | Select-Object -First 1).FullName
$outputFile = Join-Path $PSScriptRoot '..\dados\relatorios.csv'
$zip = [IO.Compression.ZipFile]::OpenRead($inputFile)

function Read-ZipText($name) {
    $entry = $zip.GetEntry($name)
    $reader = [IO.StreamReader]::new($entry.Open())
    $text = $reader.ReadToEnd()
    $reader.Dispose()
    return $text
}

function Csv($value) { return '"' + ([string]$value).Replace('"', '""') + '"' }
function ExcelDate($serial) { return ([datetime]'1899-12-30').AddDays([double]$serial).ToString('yyyy-MM-dd') }

[xml]$sharedXml = Read-ZipText 'xl/sharedStrings.xml'
$sharedNs = [Xml.XmlNamespaceManager]::new($sharedXml.NameTable)
$sharedNs.AddNamespace('x', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main')
$shared = @($sharedXml.SelectNodes('//x:si', $sharedNs) | ForEach-Object { ($_.SelectNodes('.//x:t', $sharedNs) | ForEach-Object { $_.InnerText }) -join '' })
$rows = @()

foreach ($sheetNumber in 1..3) {
    [xml]$sheetXml = Read-ZipText "xl/worksheets/sheet$sheetNumber.xml"
    $sheetNs = [Xml.XmlNamespaceManager]::new($sheetXml.NameTable)
    $sheetNs.AddNamespace('x', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main')
    foreach ($row in $sheetXml.SelectNodes('//x:row', $sheetNs)) {
        $cells = @($row.SelectNodes('./x:c', $sheetNs) | ForEach-Object {
            $value = $_.SelectSingleNode('./x:v', $sheetNs)
            if ($null -eq $value) { '' } elseif ($_.t -eq 's') { $shared[[int]$value.InnerText] } else { $value.InnerText }
        })
        if ($cells.Count -lt 4 -or $cells[1] -notmatch '^\d+(\.0)?$' -or !$cells[2]) { continue }
        $description = ($cells[3] -replace '\r?\n', ' ').Trim()
        $hymns = @([regex]::Matches($description, '"([^"]+)"') | ForEach-Object { $_.Groups[1].Value.Trim() }) -join ' | '
        $conductors = @([regex]::Matches($description, '(?i)reg\.\s*([^),.]+?)(?=\s*(?:[),.]|e\s+acomp|acomp)|$)') | ForEach-Object { $_.Groups[1].Value.Trim() }) -join ' | '
        $musicians = ''
        $musicianMatch = [regex]::Match($description, '(?i)acomp(?:anhamento)?\.?\s*(?:de\s*)?(.+?)(?:\.|$)')
        if ($musicianMatch.Success) { $musicians = $musicianMatch.Groups[1].Value.Trim() }
        $offer = $cells[4].Trim()
        if ($offer -match ',') { $offer = ($offer -replace '\.', '') -replace ',', '.' }
        $offer = $offer -replace '[^\d.-]', ''
        $rows += [pscustomobject]@{
            tipo = 'relatorio'
            data = ExcelDate $cells[1]
            atividade = $cells[2]
            hinos = $hymns
            regencia = $conductors
            musicos = $musicians
            oferta = $offer
            observacoes = $description
        }
    }
}

$directory = Split-Path $outputFile
if (!(Test-Path $directory)) { New-Item -ItemType Directory -Path $directory | Out-Null }
$header = 'tipo;data;atividade;hinos;regencia;musicos;oferta;observacoes'
$lines = @($header) + @($rows | Sort-Object data | ForEach-Object { @($_.tipo, $_.data, $_.atividade, $_.hinos, $_.regencia, $_.musicos, $_.oferta, $_.observacoes | ForEach-Object { Csv $_ }) -join ';' })
[IO.File]::WriteAllLines($outputFile, $lines, [Text.UTF8Encoding]::new($false))
$zip.Dispose()
Write-Output "Generated $($rows.Count) report records at $outputFile"