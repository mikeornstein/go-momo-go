-- Ground evidence: pee puddles stay, poo piles stay until bagged.

local gfx <const> = playdate.graphics

local PICKUP_RANGE <const> = 32

Mess = {}
Mess.__index = Mess
Mess.PICKUP_RANGE = PICKUP_RANGE

function Mess.new()
    local self = setmetatable({}, Mess)
    self:reset()
    return self
end

function Mess:reset()
    self.marks = {}
end

function Mess:add(kind, x, y)
    self.marks[#self.marks + 1] = {
        kind = kind,
        x = x,
        y = y,
        bagged = false,
        age = 0,
    }
end

function Mess:update()
    for i = 1, #self.marks do
        self.marks[i].age += 1
    end
end

function Mess:nearPoo(walkerX, walkerY)
    for i = 1, #self.marks do
        local m = self.marks[i]
        if m.kind == "poo" and not m.bagged then
            local dx = m.x - walkerX
            local dy = m.y - walkerY
            if (dx * dx + dy * dy) <= (PICKUP_RANGE * PICKUP_RANGE) then
                return m
            end
        end
    end
    return nil
end

function Mess:nearPooX(walkerX)
    for i = 1, #self.marks do
        local m = self.marks[i]
        if m.kind == "poo" and (not m.bagged) and math.abs(m.x - walkerX) <= PICKUP_RANGE then
            return m
        end
    end
    return nil
end

function Mess:hasUnbaggedPoo()
    for i = 1, #self.marks do
        local m = self.marks[i]
        if m.kind == "poo" and not m.bagged then
            return true
        end
    end
    return false
end

function Mess:draw(cameraX)
    for i = 1, #self.marks do
        local m = self.marks[i]
        local x = m.x - cameraX
        local y = m.y
        if m.kind == "pee" then
            Mess.drawPuddle(x, y, m.age)
        elseif m.kind == "poo" and not m.bagged then
            Mess.drawPile(x, y)
        end
    end
end

function Mess.drawPuddle(x, y, age)
    gfx.setColor(gfx.kColorBlack)
    gfx.fillEllipseInRect(x - 10, y - 4, 20, 7)
    gfx.setColor(gfx.kColorWhite)
    gfx.drawEllipseInRect(x - 10, y - 4, 20, 7)
    gfx.setColor(gfx.kColorBlack)
    -- Steam ticks for a second so the pee reads even after he walks off.
    if age < 30 then
        local bob = (age // 6) % 2
        gfx.drawLine(x - 4, y - 10 - bob, x - 4, y - 16 - bob)
        gfx.drawLine(x + 3, y - 8 - bob, x + 3, y - 14 - bob)
    end
end

function Mess.drawPile(x, y)
    -- Sit beside the dog, not under him, on a white pad so lawn dither cannot hide it.
    local px, py = x + 12, y + 2
    gfx.setColor(gfx.kColorWhite)
    gfx.fillCircleAtPoint(px, py - 6, 12)
    gfx.setColor(gfx.kColorBlack)
    gfx.drawCircleAtPoint(px, py - 6, 12)
    gfx.fillCircleAtPoint(px - 5, py - 3, 5)
    gfx.fillCircleAtPoint(px + 5, py - 3, 5)
    gfx.fillCircleAtPoint(px, py - 10, 5)
end
