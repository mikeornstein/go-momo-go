-- Glanceable clock and pee/poo meters. No numeric leash.

local gfx <const> = playdate.graphics

Hud = {}

local function formatClock(seconds)
    local remaining = math.max(0, math.ceil(seconds))
    local minutes = remaining // 60
    local secs = remaining % 60
    return string.format("work in %d:%02d", minutes, secs)
end

function Hud.drawClock(seconds)
    local label = formatClock(seconds)
    local w, h = 150, 22
    local x, y = 400 - w - 6, 6
    gfx.setColor(gfx.kColorWhite)
    gfx.fillRect(x, y, w, h)
    gfx.setColor(gfx.kColorBlack)
    gfx.drawRect(x, y, w, h)
    gfx.drawText(label, x + 6, y + 3)
end

local function drawMeter(x, y, fill, done)
    gfx.setColor(gfx.kColorWhite)
    gfx.fillRect(x, y, 18, 22)
    gfx.setColor(gfx.kColorBlack)
    gfx.drawRect(x, y, 18, 22)
    if done then
        gfx.drawLine(x + 4, y + 12, x + 8, y + 16)
        gfx.drawLine(x + 8, y + 16, x + 14, y + 6)
        return
    end
    local h = math.floor(20 * fill)
    if h > 0 then
        gfx.fillRect(x + 1, y + 21 - h, 16, h)
    end
end

function Hud.drawHint(text)
    if text == nil then
        return
    end
    gfx.setColor(gfx.kColorWhite)
    gfx.fillRect(6, 216, 220, 20)
    gfx.setColor(gfx.kColorBlack)
    gfx.drawRect(6, 216, 220, 20)
    gfx.drawText(text, 10, 218)
end

function Hud.drawUrges(pee, poo, didPee, didPoo)
    drawMeter(6, 6, pee, didPee)
    drawMeter(28, 6, poo, didPoo)
    -- Marks sit beside the boxes so the fill stays readable.
    gfx.setColor(gfx.kColorBlack)
    gfx.drawLine(10, 30, 10, 36)
    gfx.drawLine(10, 36, 7, 33)
    gfx.drawLine(10, 36, 13, 33)
    gfx.fillCircleAtPoint(37, 34, 3)
end
