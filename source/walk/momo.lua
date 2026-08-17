-- Greybox Momo. He picks a want; the leash only clamps him.

import "walk/leash"
import "walk/walker"

local gfx <const> = playdate.graphics

local SIZE <const> = 40
local SEEK_SPEED <const> = 2.2
local WANDER_SPEED <const> = 1.4
local COME_FRAMES <const> = 24
local YANK_FRAMES <const> = 14
local PEE_FRAMES <const> = 24
local CIRCLE_FRAMES <const> = 18
local SQUAT_FRAMES <const> = 36
local REFUSE_FRAMES <const> = 20
local SNIFF_FRAMES <const> = 30
local COOLDOWN_FRAMES <const> = 90
local MIN_Y <const> = 28
local MAX_Y <const> = 228

-- Mail / potty may sit this far outside current slack; he pulls taut toward them.
local NOTICE_PAD <const> = 48
-- Wander stays inside this fraction of leash length so idle roam is not taut.
local WANDER_SLACK <const> = 0.75
local WANDER_ARRIVE <const> = 8
local HEEL_LENGTH <const> = Leash.HEEL + 10
local ATTENTION_SEEK <const> = 40
local ATTENTION_WANDER_MIN <const> = 20
local ATTENTION_WANDER_SPAN <const> = 26
local RNG_MOD <const> = 2147483648
local TAU <const> = 6.28318530718

Momo = {}
Momo.__index = Momo
Momo.SIZE = SIZE

function Momo.new()
    local self = setmetatable({}, Momo)
    self:reset(0, 192)
    return self
end

function Momo:reset(walkerX, feetY)
    -- Sit just ahead of the walker's hand so a heel-length leash is visible.
    self.worldX = walkerX + Walker.HAND_DX + Leash.HEEL
    self.worldY = feetY
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
    self.eventX = nil
    self.eventY = nil
    self.wantKind = "heel"
    self.wantX = self.worldX
    self.wantY = self.worldY
    self.attentionFrames = 0
    self.rng = 20260816
end

function Momo:isComing()
    return self.comeFrames > 0
end

function Momo:isCommitted()
    local s = self.state
    return s == "pee" or s == "circle" or s == "squat" or s == "refuse" or s == "sniff"
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

function Momo:beginSniff()
    self.state = "sniff"
    self.goKind = "sniff"
    self.goFrames = SNIFF_FRAMES
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
    elseif self.state == "sniff" then
        self.event = "sniffed"
    end
    self.eventX = self.worldX
    self.eventY = self.worldY
    self.state = "wander"
    self.goKind = nil
    self.pottyX = nil
    self.pottyY = nil
end

function Momo:rand()
    self.rng = (self.rng * 1103515245 + 12345) % RNG_MOD
    return self.rng / RNG_MOD
end

function Momo:setWant(kind, x, y, frames)
    self.wantKind = kind
    self.wantX = x
    self.wantY = y
    self.attentionFrames = frames
end

function Momo:stimulus(ctx)
    local notice = ctx.leash.length + NOTICE_PAD
    local mailX, mailY = ctx.peemail:nearestUnread(self.worldX, ctx.walkerX, notice)
    if mailX then
        return "mail", mailX, mailY
    end
    if ctx.pooReady then
        local x, y = ctx.surfaces:nearest("poo", self.worldX, ctx.walkerX, notice)
        if x then
            return "potty", x, y
        end
    end
    if ctx.peeReady then
        local x, y = ctx.surfaces:nearest("pee", self.worldX, ctx.walkerX, notice)
        if x then
            return "potty", x, y
        end
    end
    return nil
end

function Momo:pickWander(ctx)
    local maxR = ctx.leash.length * WANDER_SLACK
    if maxR < 12 then
        maxR = 12
    end
    local angle
    if self:rand() < 0.62 then
        angle = -0.7 + self:rand() * 1.5
    else
        angle = self:rand() * TAU
    end
    local dist = 10 + self:rand() * (maxR - 10)
    local collarX = ctx.handX + math.cos(angle) * dist
    local collarY = ctx.handY + math.sin(angle) * dist
    local y = collarY + 16
    if y < MIN_Y then
        y = MIN_Y
    elseif y > MAX_Y then
        y = MAX_Y
    end
    local frames = ATTENTION_WANDER_MIN + math.floor(self:rand() * ATTENTION_WANDER_SPAN)
    self:setWant("wander", collarX, y, frames)
end

function Momo:think(ctx)
    local stimKind, sx, sy = self:stimulus(ctx)

    -- Mail / potty always beat wander and heel. Do not retarget every frame.
    if stimKind and self.wantKind ~= stimKind then
        self:setWant(stimKind, sx, sy, ATTENTION_SEEK)
        return
    end

    if stimKind then
        self.wantX = sx
        self.wantY = sy
        if self.attentionFrames < 1 then
            self.attentionFrames = ATTENTION_SEEK
        end
        return
    end

    if self.wantKind == "wander" and self.attentionFrames > 0 then
        self.attentionFrames -= 1
        local dx = self.wantX - self.worldX
        local dy = self.wantY - self.worldY
        if (dx * dx + dy * dy) > (WANDER_ARRIVE * WANDER_ARRIVE) and self.attentionFrames > 0 then
            return
        end
    end

    if ctx.leash.length <= HEEL_LENGTH then
        self:setWant("heel", ctx.handX + Leash.HEEL, ctx.feetY, 2)
        return
    end

    self:pickWander(ctx)
end

function Momo:update(ctx)
    self.event = nil
    if self.coolFrames > 0 then
        self.coolFrames -= 1
        if self.coolFrames == 0 then
            self.coolPatch = nil
        end
    end

    local committed = self:isCommitted()
    local desiredX = self.wantX
    local desiredY = self.wantY
    local speed = SEEK_SPEED

    if self.yankFrames > 0 then
        self.yankFrames -= 1
        if self.yankFrames == 0 and not committed then
            self.state = "wander"
        end
    elseif self.comeFrames > 0 then
        self.comeFrames -= 1
        desiredX = ctx.handX + Leash.HEEL
        desiredY = ctx.feetY
        self:setWant("heel", desiredX, desiredY, 2)
        if self.comeFrames == 0 then
            self.state = "wander"
        end
    elseif not committed then
        self:think(ctx)
        desiredX = self.wantX
        desiredY = self.wantY
        if self.wantKind == "wander" or self.wantKind == "heel" then
            speed = WANDER_SPEED
        end
    end

    if committed then
        self:tickGo()
        -- Planted: stay on the spot. Slack holds the walker, not him.
        if self.pottyX then
            self.worldX = self.pottyX
            self.worldY = self.pottyY
        end
    elseif self.yankFrames == 0 then
        local dx = desiredX - self.worldX
        local dy = desiredY - self.worldY
        local dist = math.sqrt(dx * dx + dy * dy)
        if dist > 0.5 then
            local step = speed
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
    local taut = ctx.leash:isTaut(ctx.handX, ctx.handY, collarX, collarY)
    if not committed then
        collarX, collarY, taut = ctx.leash:constrain(ctx.handX, ctx.handY, collarX, collarY)
        self.worldX = collarX
        self.worldY = collarY + 16
    end

    if not self:isBusy() then
        local heelDx = collarX - ctx.handX
        local heelDy = collarY - ctx.handY
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
        -- Lifted rear leg + a falling stream. The puddle is drawn by Mess.
        gfx.drawLine(x + 6, y + 28, x + 18, y + 18)
        gfx.drawLine(x + 18, y + 18, x + 20, y + 26)
        local drip = (self.goFrames % 6)
        gfx.fillCircleAtPoint(x + 20, y + 28 + drip, 2)
        gfx.fillCircleAtPoint(x + 16, y + 36, 2)
    elseif self.state == "squat" then
        -- Pile growing under him so the squat is not just a lower circle.
        local grow = 1 - (self.goFrames / SQUAT_FRAMES)
        local r = 3 + math.floor(grow * 5)
        gfx.fillCircleAtPoint(x + 12, y + 38, r)
    elseif self.state == "sniff" then
        -- Nose down + sniff ticks.
        gfx.drawLine(x + 8, y + 22, x + 18, y + 30)
        gfx.drawLine(x + 16, y + 18, x + 22, y + 16)
        gfx.drawLine(x + 16, y + 22, x + 22, y + 22)
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
