-- Greybox Momo. Moves toward a desired point, then the leash clamps him.

import "walk/leash"
import "walk/walker"

local gfx <const> = playdate.graphics

local SIZE <const> = 40
local SPEED <const> = 2.2
local COME_FRAMES <const> = 24
local YANK_FRAMES <const> = 14
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
end

function Momo:come()
    if self.yankFrames > 0 then
        return
    end
    self.comeFrames = COME_FRAMES
    self.state = "come"
end

function Momo:isComing()
    return self.comeFrames > 0
end

function Momo:yank()
    self.yankFrames = YANK_FRAMES
    self.comeFrames = 0
    self.state = "yanked"
end

function Momo:update(anchorX, anchorY, sidewalkY, desiredX, desiredY, leash)
    if self.yankFrames > 0 then
        self.yankFrames -= 1
        if self.yankFrames == 0 then
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

    if self.yankFrames == 0 then
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

    -- Clamp collar-to-hand, then convert back to feet.
    local collarX, collarY = self:collarWorld()
    local taut
    collarX, collarY, taut = leash:constrain(anchorX, anchorY, collarX, collarY)
    self.worldX = collarX
    self.worldY = collarY + 16

    if self.yankFrames == 0 and self.comeFrames == 0 then
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
    gfx.setColor(gfx.kColorWhite)
    gfx.fillCircleAtPoint(x, y + 18, 16)
    gfx.setColor(gfx.kColorBlack)
    gfx.drawCircleAtPoint(x, y + 18, 16)
    -- Floppy ear nubs + nose so he reads as a dog, not a second walker.
    gfx.fillCircleAtPoint(x - 12, y + 6, 5)
    gfx.fillCircleAtPoint(x + 12, y + 6, 5)
    gfx.fillCircleAtPoint(x, y + 20, 2)
    gfx.drawLine(x - 4, y + 12, x - 2, y + 14)
    gfx.drawLine(x + 4, y + 12, x + 2, y + 14)

    if self.yankFrames > 0 then
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
