-- Greybox Momo. Moves toward a desired point, then the leash clamps him.

import "walk/leash"
import "walk/walker"

local gfx <const> = playdate.graphics

local SIZE <const> = 40
local SPEED <const> = 2.2
local COME_FRAMES <const> = 24
local YANK_FRAMES <const> = 14
local PEE_FRAMES <const> = 18
local CIRCLE_FRAMES <const> = 18
local SQUAT_FRAMES <const> = 36
local REFUSE_FRAMES <const> = 20
local COOLDOWN_FRAMES <const> = 90
local DRAG_INTERRUPT <const> = 12
local MIN_Y <const> = 28
local MAX_Y <const> = 228

Momo = {}
Momo.__index = Momo
Momo.SIZE = SIZE

function Momo.new()
    local self = setmetatable({}, Momo)
    self:reset(0, 192)
    return self
end

function Momo:reset(walkerX, sidewalkY)
    -- Sit just ahead of the walker's hand so a heel-length leash is visible.
    self.worldX = walkerX + Walker.HAND_DX + Leash.HEEL
    self.worldY = sidewalkY
    self.state = "heel"
    self.comeFrames = 0
    self.yankFrames = 0
    self.goFrames = 0
    self.goKind = nil
    self.pottyX = nil
    self.pottyY = nil
    self.coolPatch = nil
    self.coolFrames = 0
    self.event = nil
end

function Momo:isComing()
    return self.comeFrames > 0
end

function Momo:isCommitted()
    local s = self.state
    return s == "pee" or s == "circle" or s == "squat" or s == "refuse"
end

function Momo:isBusy()
    return self:isCommitted() or self.comeFrames > 0 or self.yankFrames > 0
end

function Momo:onCooldown(patch)
    return patch ~= nil and patch == self.coolPatch and self.coolFrames > 0
end

function Momo:come()
    if self.yankFrames > 0 then
        return
    end
    if self:isCommitted() then
        self:interrupt()
    end
    self.comeFrames = COME_FRAMES
    self.state = "come"
end

function Momo:yank()
    if self:isCommitted() then
        self:interrupt()
    end
    self.yankFrames = YANK_FRAMES
    self.comeFrames = 0
    self.state = "yanked"
end

function Momo:beginPee()
    self.state = "pee"
    self.goKind = "pee"
    self.goFrames = PEE_FRAMES
    self.pottyX = self.worldX
    self.pottyY = self.worldY
end

function Momo:beginCircle()
    self.state = "circle"
    self.goKind = "poo"
    self.goFrames = CIRCLE_FRAMES
    self.pottyX = self.worldX
    self.pottyY = self.worldY
end

function Momo:beginRefuse()
    self.state = "refuse"
    self.goKind = "refuse"
    self.goFrames = REFUSE_FRAMES
    self.pottyX = self.worldX
    self.pottyY = self.worldY
end

function Momo:interrupt()
    self.state = "yanked"
    self.goFrames = 0
    self.goKind = nil
    self.pottyX = nil
    self.pottyY = nil
    self.comeFrames = 0
    self.event = "interrupted"
end

function Momo:setCooldown(patch)
    self.coolPatch = patch
    self.coolFrames = COOLDOWN_FRAMES
end

function Momo:tickGo()
    if self.goFrames <= 0 then
        return
    end
    self.goFrames -= 1
    if self.goFrames > 0 then
        return
    end
    if self.state == "circle" then
        self.state = "squat"
        self.goFrames = SQUAT_FRAMES
        return
    end
    if self.state == "pee" then
        self.event = "peed"
    elseif self.state == "squat" then
        self.event = "pooed"
    elseif self.state == "refuse" then
        self.event = "refused"
    end
    self.state = "wander"
    self.goKind = nil
    self.pottyX = nil
    self.pottyY = nil
end

function Momo:update(anchorX, anchorY, sidewalkY, desiredX, desiredY, leash)
    self.event = nil
    if self.coolFrames > 0 then
        self.coolFrames -= 1
        if self.coolFrames == 0 then
            self.coolPatch = nil
        end
    end

    local committed = self:isCommitted()

    if self.yankFrames > 0 then
        self.yankFrames -= 1
        if self.yankFrames == 0 and not committed then
            self.state = "wander"
        end
    elseif self.comeFrames > 0 then
        self.comeFrames -= 1
        desiredX = anchorX + Leash.HEEL
        desiredY = sidewalkY
        if self.comeFrames == 0 then
            self.state = "wander"
        end
    end

    if committed then
        self:tickGo()
    elseif self.yankFrames == 0 then
        local dx = desiredX - self.worldX
        local dy = desiredY - self.worldY
        local dist = math.sqrt(dx * dx + dy * dy)
        if dist > 0.5 then
            local step = SPEED
            if step > dist then
                step = dist
            end
            self.worldX += dx / dist * step
            self.worldY += dy / dist * step
        end
    end

    if self.worldY < MIN_Y then
        self.worldY = MIN_Y
    elseif self.worldY > MAX_Y then
        self.worldY = MAX_Y
    end

    local collarX, collarY = self:collarWorld()
    local taut
    collarX, collarY, taut = leash:constrain(anchorX, anchorY, collarX, collarY)
    self.worldX = collarX
    self.worldY = collarY + 16

    if self:isCommitted() and self.pottyX then
        local ddx = self.worldX - self.pottyX
        local ddy = self.worldY - self.pottyY
        if (ddx * ddx + ddy * ddy) > (DRAG_INTERRUPT * DRAG_INTERRUPT) then
            self:interrupt()
            taut = true
        end
    end

    if not self:isBusy() then
        local heelDx = collarX - anchorX
        local heelDy = collarY - anchorY
        if (heelDx * heelDx + heelDy * heelDy) <= (Leash.HEEL + 6) * (Leash.HEEL + 6) then
            self.state = "heel"
        else
            self.state = "wander"
        end
    end

    return taut
end

function Momo:draw(cameraX)
    local x = self.worldX - cameraX
    local y = self.worldY - SIZE + 4
    if self.state == "circle" then
        x += math.sin(self.goFrames * 0.8) * 6
    elseif self.state == "squat" then
        y += 6
    end

    local radius = 16
    if self.state == "squat" then
        radius = 14
    end
    gfx.setColor(gfx.kColorWhite)
    gfx.fillCircleAtPoint(x, y + 18, radius)
    gfx.setColor(gfx.kColorBlack)
    gfx.drawCircleAtPoint(x, y + 18, radius)
    gfx.fillCircleAtPoint(x - 12, y + 6, 5)
    gfx.fillCircleAtPoint(x + 12, y + 6, 5)
    gfx.fillCircleAtPoint(x, y + 20, 2)
    gfx.drawLine(x - 4, y + 12, x - 2, y + 14)
    gfx.drawLine(x + 4, y + 12, x + 2, y + 14)

    if self.state == "pee" then
        gfx.drawLine(x + 8, y + 30, x + 16, y + 24)
    elseif self.state == "refuse" then
        gfx.drawText("...", x - 8, y - 14)
    elseif self.yankFrames > 0 or self.event == "interrupted" then
        gfx.drawLine(x - 28, y + 4, x - 16, y + 10)
        gfx.drawLine(x - 30, y + 16, x - 16, y + 16)
        gfx.drawLine(x - 28, y + 28, x - 16, y + 22)
    end
end

function Momo:collarWorld()
    return self.worldX, self.worldY - 16
end

function Momo:collarScreen(cameraX)
    local cx, cy = self:collarWorld()
    return cx - cameraX, cy
end
