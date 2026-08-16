-- Walk 1 scene: commute, leash, surfaces, and the go loop.

import "CoreLibs/graphics"
import "walk/leash"
import "walk/walker"
import "walk/momo"
import "walk/surfaces"
import "walk/hud"

local pd <const> = playdate
local gfx <const> = playdate.graphics

local SCREEN_W <const> = 400
local SCREEN_H <const> = 240
local TILE <const> = 32

local YARDS_BOTTOM <const> = 96
local SIDEWALK_BOTTOM <const> = 192

-- 2 px/frame keeps 1-bit patterns locked under horizontal scroll.
local COMMUTE_SPEED <const> = 2
local REFRESH_RATE <const> = 30

local WALKER_SCREEN_X <const> = 80

local HOME_WORLD_X <const> = 2000
local CLOCK_SECONDS <const> = 50

local PEE_RATE <const> = 1 / 8
local POO_RATE <const> = 1 / 18
local PEE_GO <const> = 0.8
local POO_GO <const> = 0.85

-- Held B becomes Wait after this so a tap can still be Come.
local WAIT_HOLD_FRAMES <const> = 8
-- D-pad reel when the crank is unused (degrees/frame, same sign as getCrankChange).
local A11Y_REEL_DEGREES <const> = 6

local YARDS_PATTERN <const> = {0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA}
local STREET_PATTERN <const> = {0x55, 0x00, 0x55, 0x00, 0x55, 0x00, 0x55, 0x00}

local WIN_COPY <const> = "Good boy."
local LOSE_COPY <const> = "He can hold it. You cannot."
local GNOME_COPY <const> = "The gnome saw everything."

WalkScene = {}
WalkScene.__index = WalkScene

function WalkScene.new()
    local self = setmetatable({}, WalkScene)
    self.leash = Leash.new()
    self.walker = Walker.new()
    self.momo = Momo.new()
    self.surfaces = Surfaces.walk1()
    self:reset()
    return self
end

function WalkScene:reset()
    self.cameraX = 0
    self.clock = CLOCK_SECONDS
    self.state = "walking"
    self.bHold = 0
    self.pee = 0.45
    self.poo = 0.2
    self.didPee = false
    self.didPoo = false
    self.leash:reset()
    self.walker:reset()
    self.momo:reset(self:walkerWorldX(), SIDEWALK_BOTTOM)
end

function WalkScene:walkerWorldX()
    return self.cameraX + WALKER_SCREEN_X
end

function WalkScene:handWorld()
    return self:walkerWorldX() + Walker.HAND_DX, SIDEWALK_BOTTOM + Walker.HAND_DY
end

function WalkScene:isDocked()
    return pd.isCrankDocked()
end

local function reelInput()
    local degrees = pd.getCrankChange()
    if pd.buttonIsPressed(pd.kButtonLeft) then
        degrees -= A11Y_REEL_DEGREES
    end
    if pd.buttonIsPressed(pd.kButtonRight) then
        degrees += A11Y_REEL_DEGREES
    end
    return degrees
end

function WalkScene:desiredMomo()
    local wx = self:walkerWorldX()
    local desiredX = wx + self.leash.length * 0.7
    local desiredY = SIDEWALK_BOTTOM
    if pd.buttonIsPressed(pd.kButtonUp) then
        return desiredX, YARDS_BOTTOM - 8
    end
    if pd.buttonIsPressed(pd.kButtonDown) then
        return desiredX, SIDEWALK_BOTTOM + 24
    end
    local want = nil
    if (not self.didPoo) and self.poo >= POO_GO then
        want = "poo"
    elseif (not self.didPee) and self.pee >= PEE_GO then
        want = "pee"
    end
    if want then
        local tx, ty = self.surfaces:nearest(want, wx, self.leash.length + 48)
        if tx then
            return tx, ty
        end
    end
    return desiredX, desiredY
end

function WalkScene:update()
    if self.state ~= "walking" then
        if pd.buttonJustPressed(pd.kButtonA) or pd.buttonJustPressed(pd.kButtonB) then
            self:reset()
        end
        return
    end

    local docked = self:isDocked()
    local degrees = reelInput()
    self.leash:update(degrees, docked)

    -- Tap B = Come. Hold B = Wait only (a hold must not also Come).
    if pd.buttonIsPressed(pd.kButtonB) then
        self.bHold += 1
    else
        if self.bHold > 0 and self.bHold < WAIT_HOLD_FRAMES then
            self.momo:come()
        end
        self.bHold = 0
    end
    self.walker.waiting = (not docked) and self.bHold >= WAIT_HOLD_FRAMES

    if docked then
        self.momo:reset(self:walkerWorldX(), SIDEWALK_BOTTOM)
        self.walker.waiting = false
        return
    end

    if not self.momo:isCommitted() then
        if not self.didPee then
            self.pee = math.min(1, self.pee + PEE_RATE / REFRESH_RATE)
        end
        if not self.didPoo then
            self.poo = math.min(1, self.poo + POO_RATE / REFRESH_RATE)
        end
        self:tryStartGo()
    end

    local desiredX, desiredY = self:desiredMomo()
    local handX, handY = self:handWorld()
    local taut = self.momo:update(
        handX,
        handY,
        SIDEWALK_BOTTOM,
        desiredX,
        desiredY,
        self.leash
    )

    -- Once he starts to go, the commute pauses so slack is enough to finish.
    -- Yank / Come still interrupt.
    if self.momo:isCommitted() then
        self.walker.waiting = true
    end

    local moving = self.walker:commuteScale() > 0
    if self.leash:isYank(degrees, taut, self.momo:isComing())
        or (self.momo:isCommitted() and taut and moving)
    then
        local _, patch = self.surfaces:at(self.momo.worldX, self.momo.worldY)
        if self.momo:isCommitted() then
            self.momo:setCooldown(patch)
        end
        self.momo:yank()
        self.walker:yank()
    end

    self:handleGoEvent()

    self.walker:update()
    self.cameraX += COMMUTE_SPEED * self.walker:commuteScale()
    self.clock -= 1 / REFRESH_RATE

    if self.clock <= 0 then
        self.clock = 0
        self.state = "lose"
        return
    end

    if self:walkerWorldX() >= HOME_WORLD_X then
        self.cameraX = HOME_WORLD_X - WALKER_SCREEN_X
        if self.didPee and self.didPoo then
            self.state = "win"
        end
    end
end

function WalkScene:tryStartGo()
    if self.momo:isBusy() then
        return
    end
    local kind, patch = self.surfaces:at(self.momo.worldX, self.momo.worldY)
    if self.momo:onCooldown(patch) then
        return
    end
    if (not self.didPoo) and self.poo >= POO_GO then
        if Surfaces.allowsPoo(kind) or Surfaces.pooFails(kind) then
            self.momo:beginCircle()
            return
        end
        -- Refuse only on grass that looks close enough — never loop on sidewalk.
        if kind == "patchy" then
            self.momo:beginRefuse()
            return
        end
    end
    if (not self.didPee) and self.pee >= PEE_GO and Surfaces.allowsPee(kind) then
        self.momo:beginPee()
    end
end

function WalkScene:handleGoEvent()
    local event = self.momo.event
    if event == nil then
        return
    end
    local kind, patch = self.surfaces:at(self.momo.worldX, self.momo.worldY)
    if event == "peed" then
        self.pee = 0
        self.didPee = true
    elseif event == "pooed" then
        if Surfaces.pooFails(kind) then
            self.state = "gnome"
        else
            self.poo = 0
            self.didPoo = true
        end
    elseif event == "refused" or event == "interrupted" then
        self.momo:setCooldown(patch)
        if event == "interrupted" and not self.momo:isComing() then
            self.walker:yank()
        end
    end
end

local function drawYards(cameraX)
    gfx.setPattern(YARDS_PATTERN)
    gfx.fillRect(0, 0, SCREEN_W, YARDS_BOTTOM)
    gfx.setColor(gfx.kColorBlack)
    local first = math.floor(cameraX / (TILE * 4)) * (TILE * 4)
    for worldX = first, cameraX + SCREEN_W, TILE * 4 do
        local x = worldX - cameraX
        gfx.fillRect(x, YARDS_BOTTOM - 40, 4, 40)
        gfx.fillRect(x - 4, YARDS_BOTTOM - 44, 12, 4)
    end
end

local function drawSidewalk(cameraX)
    gfx.setColor(gfx.kColorWhite)
    gfx.fillRect(0, YARDS_BOTTOM, SCREEN_W, SIDEWALK_BOTTOM - YARDS_BOTTOM)
    gfx.setColor(gfx.kColorBlack)
    gfx.drawLine(0, YARDS_BOTTOM, SCREEN_W, YARDS_BOTTOM)
    gfx.drawLine(0, SIDEWALK_BOTTOM, SCREEN_W, SIDEWALK_BOTTOM)
    local first = math.floor(cameraX / TILE) * TILE
    for worldX = first, cameraX + SCREEN_W, TILE do
        local x = worldX - cameraX
        gfx.drawLine(x, YARDS_BOTTOM, x, SIDEWALK_BOTTOM)
    end
end

local function drawStreet(cameraX)
    gfx.setPattern(STREET_PATTERN)
    gfx.fillRect(0, SIDEWALK_BOTTOM, SCREEN_W, SCREEN_H - SIDEWALK_BOTTOM)
    gfx.setColor(gfx.kColorBlack)
    local first = math.floor(cameraX / (TILE * 2)) * (TILE * 2)
    for worldX = first, cameraX + SCREEN_W, TILE * 2 do
        local x = worldX - cameraX
        gfx.fillRect(x, SIDEWALK_BOTTOM + 20, 16, 4)
    end
end

local function drawHome(cameraX)
    local x = HOME_WORLD_X - cameraX
    if x > SCREEN_W + TILE or x < -80 then
        return
    end
    gfx.setColor(gfx.kColorWhite)
    gfx.fillRect(x, YARDS_BOTTOM - 64, 56, 64)
    gfx.setColor(gfx.kColorBlack)
    gfx.drawRect(x, YARDS_BOTTOM - 64, 56, 64)
    gfx.fillRect(x + 20, YARDS_BOTTOM - 36, 16, 36)
    gfx.drawText("home", x + 6, YARDS_BOTTOM - 80)
end

local function drawEndCard(copy)
    gfx.setColor(gfx.kColorWhite)
    gfx.fillRect(0, 0, SCREEN_W, SCREEN_H)
    gfx.setColor(gfx.kColorBlack)
    gfx.drawTextAligned(copy, SCREEN_W / 2, 100, kTextAlignment.center)
    gfx.drawTextAligned("A/B to walk again", SCREEN_W / 2, 140, kTextAlignment.center)
end

function WalkScene:draw()
    if self.state == "win" then
        drawEndCard(WIN_COPY)
        return
    end
    if self.state == "lose" then
        drawEndCard(LOSE_COPY)
        return
    end
    if self.state == "gnome" then
        drawEndCard(GNOME_COPY)
        return
    end

    gfx.setColor(gfx.kColorWhite)
    gfx.fillRect(0, 0, SCREEN_W, SCREEN_H)

    drawYards(self.cameraX)
    self.surfaces:drawGrass(self.cameraX, SCREEN_W)
    drawSidewalk(self.cameraX)
    drawStreet(self.cameraX)
    self.surfaces:drawProps(self.cameraX, SCREEN_W)
    drawHome(self.cameraX)

    self.walker:draw(WALKER_SCREEN_X, SIDEWALK_BOTTOM)
    local handX, handY = self.walker:handScreen(WALKER_SCREEN_X, SIDEWALK_BOTTOM)
    local collarX, collarY = self.momo:collarScreen(self.cameraX)
    self.leash:draw(handX, handY, collarX, collarY)
    self.momo:draw(self.cameraX)
    Hud.drawClock(self.clock)
    Hud.drawUrges(self.pee, self.poo, self.didPee, self.didPoo)
    if self.momo:isCommitted() then
        Hud.drawHint("waiting — B tap cancels")
    elseif self.walker.waiting then
        Hud.drawHint("waiting")
    else
        Hud.drawHint("hold B to wait")
    end

    if self:isDocked() then
        pd.ui.crankIndicator:draw()
    end
end
