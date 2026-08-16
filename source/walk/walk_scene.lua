-- Walk 1 scene shell: auto-scroll sidewalk, commute clock, stub end cards.
-- Leash, Momo, and potty land in later tickets.

local pd <const> = playdate
local gfx <const> = playdate.graphics

local SCREEN_W <const> = 400
local SCREEN_H <const> = 240
local TILE <const> = 32

-- Horizontal bands (tile-aligned). Yards / sidewalk / street.
local YARDS_BOTTOM <const> = 96
local SIDEWALK_BOTTOM <const> = 192

-- 2 px/frame keeps 1-bit patterns locked under horizontal scroll.
local COMMUTE_SPEED <const> = 2
local REFRESH_RATE <const> = 30

-- Walker stays at a fixed screen X; the world commutes past.
local WALKER_SCREEN_X <const> = 80
local WALKER_W <const> = 40
local WALKER_H <const> = 48

-- Home is a world-space marker. Win stub fires when the walker arrives.
local HOME_WORLD_X <const> = 2000
local CLOCK_SECONDS <const> = 45

-- Vertical pipes: stable under horizontal scroll (not a flashing checker).
local YARDS_PATTERN <const> = {0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA}
local STREET_PATTERN <const> = {0x55, 0x00, 0x55, 0x00, 0x55, 0x00, 0x55, 0x00}

local WIN_COPY <const> = "Good boy."
local LOSE_COPY <const> = "He can hold it. You cannot."

WalkScene = {}
WalkScene.__index = WalkScene

function WalkScene.new()
    local self = setmetatable({}, WalkScene)
    self:reset()
    return self
end

function WalkScene:reset()
    self.cameraX = 0
    self.clock = CLOCK_SECONDS
    self.state = "walking"
    self.walkFrame = 0
end

function WalkScene:walkerWorldX()
    return self.cameraX + WALKER_SCREEN_X
end

function WalkScene:isDocked()
    return pd.isCrankDocked()
end

function WalkScene:update()
    if self.state ~= "walking" then
        if pd.buttonJustPressed(pd.kButtonA) or pd.buttonJustPressed(pd.kButtonB) then
            self:reset()
        end
        return
    end

    -- Docked: show the official crank indicator and do not commute or tick.
    if self:isDocked() then
        return
    end

    self.walkFrame += 1
    self.cameraX += COMMUTE_SPEED
    self.clock -= 1 / REFRESH_RATE

    if self.clock <= 0 then
        self.clock = 0
        self.state = "lose"
        return
    end

    if self:walkerWorldX() >= HOME_WORLD_X then
        self.state = "win"
    end
end

local function formatClock(seconds)
    local remaining = math.max(0, math.ceil(seconds))
    local minutes = remaining // 60
    local secs = remaining % 60
    return string.format("work in %d:%02d", minutes, secs)
end

local function drawYards(cameraX)
    gfx.setPattern(YARDS_PATTERN)
    gfx.fillRect(0, 0, SCREEN_W, YARDS_BOTTOM)
    gfx.setColor(gfx.kColorBlack)
    -- Fence posts every 4 tiles so motion reads without becoming clutter.
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

local function drawWalker(walkFrame)
    local feetY = SIDEWALK_BOTTOM
    local x = WALKER_SCREEN_X - WALKER_W / 2
    local y = feetY - WALKER_H
    -- Tiny bob so the commute reads while the sprite stays put on screen.
    if walkFrame % 16 >= 8 then
        y -= 1
    end
    gfx.setColor(gfx.kColorWhite)
    gfx.fillRoundRect(x, y, WALKER_W, WALKER_H, 3)
    gfx.setColor(gfx.kColorBlack)
    gfx.drawRoundRect(x, y, WALKER_W, WALKER_H, 3)
    gfx.fillCircleAtPoint(x + WALKER_W / 2, y + 10, 6)
    gfx.drawLine(x + 12, y + 24, x + 12, y + 40)
    gfx.drawLine(x + 28, y + 24, x + 28, y + 40)
end

local function drawClock(seconds)
    local label = formatClock(seconds)
    local w, h = 150, 22
    local x, y = SCREEN_W - w - 6, 6
    gfx.setColor(gfx.kColorWhite)
    gfx.fillRect(x, y, w, h)
    gfx.setColor(gfx.kColorBlack)
    gfx.drawRect(x, y, w, h)
    gfx.drawText(label, x + 6, y + 3)
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

    gfx.setColor(gfx.kColorWhite)
    gfx.fillRect(0, 0, SCREEN_W, SCREEN_H)

    drawYards(self.cameraX)
    drawSidewalk(self.cameraX)
    drawStreet(self.cameraX)
    drawHome(self.cameraX)
    drawWalker(self.walkFrame)
    drawClock(self.clock)

    if self:isDocked() then
        pd.ui.crankIndicator:draw()
    end
end
