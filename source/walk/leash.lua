-- Retractable leash. Clockwise pays out, counterclockwise reels in.

local gfx <const> = playdate.graphics

local HEEL <const> = 28
local MAX <const> = 130
local PIXELS_PER_DEGREE <const> = 0.4
-- Fast wind-in while taut. Negative = counterclockwise = shorter.
local YANK_DEGREES <const> = -22

Leash = {}
Leash.__index = Leash
Leash.HEEL = HEEL
Leash.MAX = MAX

function Leash.new()
    local self = setmetatable({}, Leash)
    self:reset()
    return self
end

function Leash:reset()
    self.length = HEEL
end

function Leash:update(degrees, docked)
    if docked then
        self.length = HEEL
        return
    end
    local next = self.length + degrees * PIXELS_PER_DEGREE
    if next < HEEL then
        next = HEEL
    elseif next > MAX then
        next = MAX
    end
    self.length = next
end

function Leash:isYank(degrees, taut, coming)
    return taut and (not coming) and degrees <= YANK_DEGREES
end

function Leash:constrain(anchorX, anchorY, x, y)
    local dx = x - anchorX
    local dy = y - anchorY
    local dist = math.sqrt(dx * dx + dy * dy)
    if dist <= self.length or dist < 0.001 then
        return x, y, false
    end
    local scale = self.length / dist
    return anchorX + dx * scale, anchorY + dy * scale, true
end

function Leash:draw(x1, y1, x2, y2)
    local dx = x2 - x1
    local dy = y2 - y1
    local dist = math.sqrt(dx * dx + dy * dy)
    local slack = self.length - dist
    gfx.setColor(gfx.kColorBlack)
    if slack < 4 then
        gfx.drawLine(x1, y1, x2, y2)
        return
    end
    local sag = slack
    if sag > 18 then
        sag = 18
    end
    local mx = (x1 + x2) / 2
    local my = (y1 + y2) / 2 + sag * 0.45
    gfx.drawLine(x1, y1, mx, my)
    gfx.drawLine(mx, my, x2, y2)
end
